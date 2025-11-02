'use client';

import { useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface Transaction {
  TransactionID: string;
  AccountID: string;
  TransactionAmount: string;
  TransactionDate: string;
  TransactionType?: string;
  Location?: string;
  DeviceID?: string;
  MerchantID?: string;
  Channel?: string;
  LoginAttempts?: number;
  TransactionDuration?: number;
  AccountBalance?: string;
  CustomerAge?: number;
  CustomerOccupation?: string;
  withdrawal_ratio?: number;
  transaction_hour?: number;
  fraud_gmm: number;
  isolation_fraud: number;
  fraud_either: number;
  fraud_both: number;
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

interface GraphNode {
  id: string;
  color: string;
  size: number;
  fraud_gmm: number;
  isolation_fraud: number;
  fraud_either: number;
  fraud_both: number;
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
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface FraudGraphProps {
  data: Transaction[];
  onNodeClick?: (details: FraudDetails) => void;
}

export default function FraudGraph({ data, onNodeClick }: FraudGraphProps) {
  const graphRef = useRef<any>(null);

  // Build graph data with useMemo for performance
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = data.map((tx) => {
    let color: string;
    let size: number;

    if (tx.fraud_both === 1) {
      color = '#ef4444'; // Red
      size = 8;
    } else if (tx.fraud_either === 1) {
      color = '#3b82f6'; // Blue
      size = 6;
    } else {
      color = '#9ca3af'; // Gray
      size = 4;
    }

    return {
      id: tx.TransactionID,
      color,
      size,
      fraud_gmm: tx.fraud_gmm,
      isolation_fraud: tx.isolation_fraud,
      fraud_either: tx.fraud_either,
      fraud_both: tx.fraud_both,
      amount: tx.TransactionAmount,
      accountId: tx.AccountID,
      transactionDate: tx.TransactionDate,
      transactionType: tx.TransactionType,
      location: tx.Location,
      deviceId: tx.DeviceID,
      merchantId: tx.MerchantID,
      channel: tx.Channel,
      loginAttempts: tx.LoginAttempts,
      transactionDuration: tx.TransactionDuration,
      accountBalance: tx.AccountBalance,
      customerAge: tx.CustomerAge,
      customerOccupation: tx.CustomerOccupation,
      withdrawalRatio: tx.withdrawal_ratio,
      transactionHour: tx.transaction_hour,
    };
  });

  // Create links between transactions from same account
  const accountMap = new Map<string, string[]>();
  nodes.forEach((node) => {
    if (!accountMap.has(node.accountId)) {
      accountMap.set(node.accountId, []);
    }
    accountMap.get(node.accountId)!.push(node.id);
  });

    const links: GraphLink[] = [];
    accountMap.forEach((transactionIds) => {
      for (let i = 0; i < transactionIds.length - 1; i++) {
        links.push({
          source: transactionIds[i],
          target: transactionIds[i + 1],
        });
      }
    });

    return { nodes, links };
  }, [data]);

  const handleNodeClick = (node: GraphNode) => {
    const fraudDetails: FraudDetails = {
      transactionId: node.id,
      amount: node.amount,
      accountId: node.accountId,
      transactionDate: node.transactionDate,
      transactionType: node.transactionType,
      location: node.location,
      deviceId: node.deviceId,
      merchantId: node.merchantId,
      channel: node.channel,
      loginAttempts: node.loginAttempts,
      transactionDuration: node.transactionDuration,
      accountBalance: node.accountBalance,
      customerAge: node.customerAge,
      customerOccupation: node.customerOccupation,
      withdrawalRatio: node.withdrawalRatio,
      transactionHour: node.transactionHour,
      fraud_gmm: node.fraud_gmm,
      isolation_fraud: node.isolation_fraud,
      fraud_either: node.fraud_either,
      fraud_both: node.fraud_both,
    };

    console.log('=== Fraud Detection Details ===');
    console.log('Transaction ID:', fraudDetails.transactionId);
    console.log('Account ID:', fraudDetails.accountId);
    console.log('Amount:', `$${fraudDetails.amount}`);
    console.log('GMM Model:', fraudDetails.fraud_gmm === 1 ? 'Detected' : 'Not Detected');
    console.log('Isolation Forest:', fraudDetails.isolation_fraud === 1 ? 'Detected' : 'Not Detected');
    console.log('Both Detected:', fraudDetails.fraud_both === 1);
    console.log('===========================');

    if (onNodeClick) {
      onNodeClick(fraudDetails);
    }
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600 dark:text-gray-400">Loading graph...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: any) => `${node.id}\n$${parseFloat(node.amount).toFixed(2)}`}
        nodeColor={(node: any) => node.color}
        nodeVal={(node: any) => node.size}
        linkColor={() => 'rgba(156, 163, 175, 0.4)'}
        linkWidth={1}
        linkDirectionalArrowLength={0}
        onNodeClick={handleNodeClick}
        cooldownTicks={100}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 20);
          }
        }}
      />
    </div>
  );
}
