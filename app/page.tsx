'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Papa from 'papaparse';
import Chatbot from './components/Chatbot';

const FraudGraph = dynamic(() => import('./components/FraudGraph'), {
  ssr: false,
});

interface FraudDetails {
  transactionId: string;
  amount: string;
  accountId: string;
  fraud_gmm: number;
  isolation_fraud: number;
  fraud_either: number;
  fraud_both: number;
}

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

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFraudDetails, setSelectedFraudDetails] = useState<FraudDetails | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    bothDetected: 0,
    oneDetected: 0,
    noneDetected: 0,
  });

  useEffect(() => {
    // Load CSV data
    fetch('/data/fraud_labeled_combined.csv')
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse<Transaction>(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          transform: (value, field) => {
            // Convert numeric fields
            if (
              field === 'fraud_gmm' ||
              field === 'isolation_fraud' ||
              field === 'fraud_either' ||
              field === 'fraud_both' ||
              field === 'LoginAttempts' ||
              field === 'TransactionDuration' ||
              field === 'CustomerAge' ||
              field === 'transaction_hour'
            ) {
              const parsed = parseInt(value, 10);
              return isNaN(parsed) ? value : parsed;
            }
            // Convert float fields (withdrawal_ratio only - amounts stay as strings)
            if (field === 'withdrawal_ratio') {
              const parsed = parseFloat(value);
              return isNaN(parsed) ? value : parsed;
            }
            return value;
          },
          complete: (results) => {
            const data = results.data.filter((tx) => tx.TransactionID);
            setTransactions(data);

            // Calculate stats
            const both = data.filter((tx) => tx.fraud_both === 1).length;
            const one = data.filter(
              (tx) => tx.fraud_either === 1 && tx.fraud_both === 0
            ).length;
            const none = data.filter((tx) => tx.fraud_either === 0).length;

            setStats({
              total: data.length,
              bothDetected: both,
              oneDetected: one,
              noneDetected: none,
            });

            setLoading(false);
          },
        });
      })
      .catch((error) => {
        console.error('Error loading CSV:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      <div className="flex h-screen overflow-hidden">
        {/* Main Content Area */}
        <div className={`flex-1 transition-all duration-300 ${isRightPanelOpen ? 'mr-96' : 'mr-0'}`}>
          <div className="container mx-auto px-6 py-8 h-full overflow-y-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                SENTINEL COPILOT
          </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Dashboard Fraud Monitoring System
              </p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-2xl">
            Interactive network visualization of transaction fraud detection. Click on nodes to view
            detailed ML model predictions in the assistant panel.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total.toLocaleString()}</div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-red-200 dark:border-red-900/30 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Both ML Detected
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.bothDetected}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.total > 0 ? ((stats.bothDetected / stats.total) * 100).toFixed(2) : 0}% of total
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-900/30 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                One ML Detected
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.oneDetected}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.total > 0 ? ((stats.oneDetected / stats.total) * 100).toFixed(2) : 0}% of total
            </div>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                No Fraud Detected
              </div>
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            </div>
            <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.noneDetected}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {stats.total > 0 ? ((stats.noneDetected / stats.total) * 100).toFixed(2) : 0}% of total
            </div>
          </div>
        </div>

            {/* Graph Container - Main Panel, Full Width */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '700px' }}>
              <div className="p-5 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/70 dark:bg-gray-800/70">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Transaction Network Graph
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-xs">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">Both ML</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">One ML</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-gray-700 dark:text-gray-300">None</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                      title={isRightPanelOpen ? 'Hide Assistant' : 'Show Assistant'}
                    >
                      <svg
                        className={`w-4 h-4 transition-transform ${isRightPanelOpen ? '' : 'rotate-180'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {isRightPanelOpen ? 'Hide' : 'Show'} Assistant
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-5 h-[calc(100%-81px)]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <div className="text-gray-600 dark:text-gray-400">Loading transaction data...</div>
                    </div>
                  </div>
                ) : (
                  <FraudGraph data={transactions} onNodeClick={setSelectedFraudDetails} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Independent, Collapsible */}
        <div
          className={`fixed right-0 top-0 h-full w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-l border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 z-50 ${
            isRightPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            <Chatbot fraudDetails={selectedFraudDetails} />
          </div>
        </div>
      </div>
    </div>
  );
}
