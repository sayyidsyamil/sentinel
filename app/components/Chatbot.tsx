'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

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

interface ChatbotProps {
  fraudDetails: FraudDetails | null;
}

export default function Chatbot({ fraudDetails }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const clearChat = () => {
    setMessages([
      {
        type: 'bot',
        content:
          "👋 Hello! I'm your fraud detection assistant. Click on any node in the graph to see which ML model detected fraud.",
        timestamp: new Date(),
      },
    ]);
  };

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        type: 'bot',
        content:
          "👋 Hello! I'm your fraud detection assistant. Click on any node in the graph to see which ML model detected fraud.",
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (fraudDetails) {
      // Show loading message
      setIsAnalyzing(true);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          content: '🔍 Analyzing transaction with AI...',
          timestamp: new Date(),
        },
      ]);

      // Call API to get LLM explanation
      fetch('/api/fraud-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fraudDetails),
      })
        .then((response) => response.json())
        .then((data) => {
          setIsAnalyzing(false);
          
          // Remove loading message
          setMessages((prev) => prev.slice(0, -1));

          if (data.error) {
            // Fallback to basic message if API fails
            const fallbackMessage = buildFallbackMessage(fraudDetails);
            let errorMessage = `⚠️ ${data.error}\n\n`;
            
            // Add helpful instructions if it's an auth error
            if (data.error.includes('authentication') || data.error.includes('Azure')) {
              errorMessage += `\n🔧 To enable AI-powered analysis:\n`;
              if (data.methods && Array.isArray(data.methods)) {
                data.methods.forEach((method: string) => {
                  errorMessage += `${method}\n`;
                });
              } else {
                errorMessage += `1. Install Azure CLI: https://aka.ms/installazurecliwindows\n`;
                errorMessage += `2. Run: az login\n`;
                errorMessage += `3. Restart the development server\n`;
              }
              errorMessage += `\n`;
            }
            
            errorMessage += `\n📊 Basic Analysis:\n${fallbackMessage}`;
            
            setMessages((prev) => [
              ...prev,
              {
                type: 'bot',
                content: errorMessage,
                timestamp: new Date(),
              },
            ]);
          } else {
            // Use LLM explanation
            const llmMessage = `Transaction Analysis\n\n` +
              `Transaction ID: ${data.transactionId}\n` +
              `Account ID: ${data.accountId}\n` +
              `Amount: $${data.amount}\n\n` +
              `${data.explanation}`;

            setMessages((prev) => [
              ...prev,
              {
                type: 'bot',
                content: llmMessage,
                timestamp: new Date(),
              },
            ]);
          }
        })
        .catch((error) => {
          setIsAnalyzing(false);
          console.error('Error calling fraud analysis API:', error);
          
          // Remove loading message
          setMessages((prev) => prev.slice(0, -1));

          // Fallback to basic message
          const fallbackMessage = buildFallbackMessage(fraudDetails);
          setMessages((prev) => [
            ...prev,
            {
              type: 'bot',
              content: `⚠️ Unable to connect to AI service. Showing basic analysis:\n\n${fallbackMessage}`,
              timestamp: new Date(),
            },
          ]);
        });
    }
  }, [fraudDetails]);

  const buildFallbackMessage = (fraudDetails: FraudDetails): string => {
    if (fraudDetails.fraud_both === 1) {
      return `🔴 FRAUD DETECTED BY BOTH MODELS\n\n` +
        `✅ GMM Model detected fraud\n` +
        `✅ Isolation Forest Model detected fraud\n\n` +
        `Both models agree this transaction is fraudulent.`;
    } else if (fraudDetails.fraud_either === 1) {
      const models = [];
      if (fraudDetails.fraud_gmm === 1) models.push('GMM Model');
      if (fraudDetails.isolation_fraud === 1) models.push('Isolation Forest Model');
      
      return `🔵 FRAUD DETECTED BY ONE MODEL\n\n` +
        `✅ ${models.join(' and ')} detected fraud\n\n` +
        `Only one model flagged this transaction for review.`;
    } else {
      return `⚪ NO FRAUD DETECTED\n\n` +
        `❌ GMM Model: No fraud detected\n` +
        `❌ Isolation Forest Model: No fraud detected\n\n` +
        `Both models indicate this is a legitimate transaction.`;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sentinel Copilot
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                AI-Powered Fraud Analysis
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
            title="Clear chat history"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50/30 to-white dark:from-gray-900/30 dark:to-gray-800/30">
        {messages.map((message, index) => {
          const isAnalyzingMsg = message.content.includes('Analyzing');
          const isAIGenerated = message.content.includes('RISK CLASSIFICATION') || message.content.includes('FRAUD INVESTIGATION REPORT') || message.content.includes('DETECTION ANALYSIS');
          const isFraudBoth = !isAIGenerated && (message.content.includes('FRAUD DETECTED BY BOTH') || message.content.includes('Both models'));
          const isFraudOne = !isAIGenerated && (message.content.includes('FRAUD DETECTED BY ONE') || (message.content.includes('Only') && message.content.includes('detected fraud')));
          const isNoFraud = !isAIGenerated && (message.content.includes('NO FRAUD DETECTED') || message.content.includes('No fraud detected'));

          return (
            <div
              key={index}
              className={`flex ${message.type === 'bot' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[90%] rounded-xl p-5 shadow-md ${
                  message.type === 'bot'
                    ? isAnalyzingMsg
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30'
                      : isAIGenerated
                      ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                      : isFraudBoth
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30'
                      : isFraudOne
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30'
                      : isNoFraud
                      ? 'bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-900/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
              >
                <div className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 prose prose-sm max-w-none prose-headings:mt-4 prose-headings:mb-2 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-h1:text-xl prose-h1:font-bold prose-h2:text-lg prose-h2:font-semibold prose-h3:text-base prose-h3:font-semibold prose-p:my-2 prose-p:leading-relaxed prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold prose-ul:my-2 prose-ul:ml-4 prose-li:my-1 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-table:w-full prose-table:my-4 prose-th:bg-gray-100 dark:prose-th:bg-gray-700 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-hr:my-4 prose-hr:border-gray-300 dark:prose-hr:border-gray-600">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-3 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
                      p: ({ node, ...props }) => <p className="my-2 leading-relaxed" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-2 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-4 my-2 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="my-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-gray-100 dark:bg-gray-700" {...props} />,
                      tbody: ({ node, ...props }) => <tbody {...props} />,
                      tr: ({ node, ...props }) => <tr className="border-b border-gray-200 dark:border-gray-700" {...props} />,
                      th: ({ node, ...props }) => (
                        <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="px-3 py-2 border border-gray-300 dark:border-gray-600" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-400 pl-4 italic my-4 text-gray-700 dark:text-gray-300" {...props} />
                      ),
                      hr: ({ node, ...props }) => (
                        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-600" {...props} />
                      ),
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                        ) : (
                          <code className="block bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm font-mono overflow-x-auto my-2" {...props} />
                        ),
                      pre: ({ node, ...props }) => (
                        <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto my-2" {...props} />
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-800/60">
        <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">
          💡 Click on graph nodes to analyze transactions
        </p>
      </div>
    </div>
  );
}

