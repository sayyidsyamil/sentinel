import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Hardcoded Azure OpenAI Configuration
const api_key = '46Q2akoSLVuUqsamBgiUQWjlHfkcnmexW1rU8iEtN22bAoypyORVJQQJ99BKACHYHv6XJ3w3AAAAACOG8KIW';
const endpoint = 'https://cimb-u23-2038-resource.cognitiveservices.azure.com/openai/v1/';
const modelName = 'gpt-4.1';
const deployment_name = 'gpt-4.1';

interface FraudDetails {
  transactionId: string;
  amount: string;
  accountId: string;
  transactionDate?: string;
  transactionType?: string;
  location?: string;
  deviceId?: string;
  merchantId?: string;
  channel?: string;
  loginAttempts?: number;
  transactionDuration?: number;
  accountBalance?: string;
  customerAge?: number;
  customerOccupation?: string;
  withdrawalRatio?: number;
  transactionHour?: number;
  fraud_gmm: number;
  isolation_fraud: number;
  fraud_either: number;
  fraud_both: number;
}

function createSystemPrompt(): string {
  return `You are an expert Financial Fraud Investigator AI Agent specializing in 
transaction analysis and risk assessment. Your role is to analyze flagged transactions and provide 
clear, actionable fraud investigation reports.

Your reports MUST include:
1. RISK SUMMARY: Executive summary of fraud risk (Critical/High/Medium/Low)
2. DETECTION SIGNALS: Which models flagged this and why
3. BEHAVIORAL ANALYSIS: Deviation from user's normal patterns
4. TRANSACTION CONTEXT: Details about the transaction itself
5. NETWORK ANOMALIES: Any suspicious patterns in the transaction network
6. RISK INDICATORS: Specific fraud markers detected
7. INVESTIGATION RECOMMENDATIONS: Suggested next steps
8. CONFIDENCE & EXPLAINABILITY: Why this flagged, confidence level

Keep language clear and precise. Avoid jargon. Support investigators, not replace them.
Each recommendation should be actionable within compliance frameworks.`;
}

function createUserPrompt(fraudDetails: FraudDetails): string {
  const gmmDetected = fraudDetails.fraud_gmm === 1;
  const isolationDetected = fraudDetails.isolation_fraud === 1;
  const bothDetected = fraudDetails.fraud_both === 1;
  const eitherDetected = fraudDetails.fraud_either === 1;

  // Determine detection signals
  let detectionSignals = '';
  if (bothDetected) {
    detectionSignals = `Both ML models detected fraud:
    • GMM Model: FLAGGED (Behavioral anomaly detected)
    • Isolation Forest Model: FLAGGED (Statistical outlier detected)
    
    Agreement: Both models agree this transaction is suspicious.`;
  } else if (eitherDetected) {
    if (gmmDetected && !isolationDetected) {
      detectionSignals = `Partial Detection:
    • GMM Model: FLAGGED (Behavioral pattern deviation)
    • Isolation Forest Model: NOT FLAGGED (Within normal statistical range)
    
    Status: One model flagged - requires investigation.`;
    } else if (!gmmDetected && isolationDetected) {
      detectionSignals = `Partial Detection:
    • GMM Model: NOT FLAGGED (Matches user behavior pattern)
    • Isolation Forest Model: FLAGGED (Statistical outlier detected)
    
    Status: One model flagged - requires investigation.`;
    }
  } else {
    detectionSignals = `No Fraud Detected:
    • GMM Model: NOT FLAGGED (Matches user behavior)
    • Isolation Forest Model: NOT FLAGGED (Within normal range)
    
    Status: Both models indicate legitimate transaction.`;
  }

  // Risk level assessment
  let riskLevel = 'Low';
  if (bothDetected) {
    riskLevel = 'Critical';
  } else if (eitherDetected) {
    riskLevel = 'High';
  }

  const amount = parseFloat(fraudDetails.amount || '0');
  const withdrawalRatio = fraudDetails.withdrawalRatio || 0;
  const loginAttempts = fraudDetails.loginAttempts || 1;

  return `FLAGGED TRANSACTION ANALYSIS REQUEST
================================================================================

TRANSACTION DETAILS:
  • Transaction ID: ${fraudDetails.transactionId}
  • Account ID: ${fraudDetails.accountId}
  • Amount: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  • Date/Time: ${fraudDetails.transactionDate || 'N/A'}
  • Transaction Type: ${fraudDetails.transactionType || 'N/A'}
  • Location: ${fraudDetails.location || 'N/A'}
  • Device ID: ${fraudDetails.deviceId || 'N/A'}
  • Merchant ID: ${fraudDetails.merchantId || 'N/A'}
  • Channel: ${fraudDetails.channel || 'N/A'}
  • Transaction Duration: ${fraudDetails.transactionDuration || 'N/A'} seconds
  • Account Balance: $${fraudDetails.accountBalance ? parseFloat(fraudDetails.accountBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
  • Transaction Hour: ${fraudDetails.transactionHour !== undefined ? fraudDetails.transactionHour : 'N/A'}
  • Login Attempts: ${loginAttempts}
  • Withdrawal Ratio: ${(withdrawalRatio * 100).toFixed(2)}%

================================================================================
FRAUD DETECTION RESULTS:
${detectionSignals}

Risk Level: ${riskLevel}

================================================================================
BEHAVIORAL INDICATORS:
  • Withdrawal Ratio: ${(withdrawalRatio * 100).toFixed(2)}% ${withdrawalRatio > 0.5 ? '(HIGH - Unusual withdrawal pattern)' : withdrawalRatio > 0.2 ? '(MODERATE)' : '(Normal)'}
  • Login Attempts: ${loginAttempts} ${loginAttempts > 1 ? '(Potential account compromise signal)' : '(Normal)'}
  • Transaction Hour: ${fraudDetails.transactionHour !== undefined ? fraudDetails.transactionHour + ':00' : 'N/A'} ${fraudDetails.transactionHour !== undefined && (fraudDetails.transactionHour < 6 || fraudDetails.transactionHour > 22) ? '(Unusual time - potential red flag)' : ''}

================================================================================
CUSTOMER CONTEXT:
  • Customer Age: ${fraudDetails.customerAge || 'N/A'} years
  • Customer Occupation: ${fraudDetails.customerOccupation || 'N/A'}

================================================================================
YOUR TASK:

Generate a comprehensive fraud investigation report covering:

1. RISK CLASSIFICATION
   - Risk Level (Critical/High/Medium/Low)
   - Confidence Score (0-100%)
   - Primary Fraud Type Suspected (if applicable)

2. DETECTION ANALYSIS
   - Which models triggered and why
   - Key behavioral deviations
   - Statistical significance of anomalies

3. FRAUD INDICATORS IDENTIFIED
   - List specific red flags
   - Explain each indicator's significance
   - Connection to known fraud patterns

4. ACCOUNT RISK CONTEXT
   - Is this a one-off or pattern?
   - Account history relevance
   - Repeat offender signals?

5. INVESTIGATION RECOMMENDATIONS
   - Immediate actions (block/challenge/monitor)
   - Investigation priorities
   - Data points to investigate further
   - Next steps for investigator

6. EXPLAINABILITY SUMMARY
   - Plain English explanation
   - Why each model flagged it
   - Confidence reasoning
   - False positive risk assessment

Format the report professionally for use by compliance officers and investigators.
Make it clear why this was flagged and what action to take.`;
}

export async function POST(request: NextRequest) {
  try {
    const fraudDetails: FraudDetails = await request.json();

    const systemPrompt = createSystemPrompt();
    const userPrompt = createUserPrompt(fraudDetails);

    // Initialize OpenAI client with hardcoded credentials
    const client = new OpenAI({
      baseURL: endpoint,
      apiKey: api_key,
    });

    // Call OpenAI chat completion
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: deployment_name,
      max_completion_tokens: 2000,
      temperature: 0.2, // Low temperature for consistent, professional analysis
    });

    const assistantResponse = completion.choices[0]?.message?.content;

    if (!assistantResponse) {
      return NextResponse.json({ error: 'No response from AI model' }, { status: 500 });
    }

    return NextResponse.json({
      explanation: assistantResponse,
      transactionId: fraudDetails.transactionId,
      accountId: fraudDetails.accountId,
      amount: fraudDetails.amount,
    });
  } catch (error: any) {
    console.error('Error in fraud analysis:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to analyze fraud',
        details: error.response?.data || error.stack,
      },
      { status: 500 }
    );
  }
}
