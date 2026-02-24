'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface StoreData {
  storeName: string;
  platform: string;
  totalSales: number;
  transactions: number;
  avgTransaction: number;
}

interface SalesData {
  stores: StoreData[];
  topStores: StoreData[];
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
}

export default function SalesPage() {
  const [data, setData] = useState<SalesData>({
    stores: [],
    topStores: [],
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/sales');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'takemypayments':
        return 'bg-blue-100 text-blue-700 ring-1 ring-blue-200';
      case 'booker':
        return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
      case 'paypal':
        return 'bg-purple-100 text-purple-700 ring-1 ring-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading sales data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (data.stores.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Sales Overview</h1>
          <p className="text-base text-slate-600 mb-8">Detailed sales analysis by store</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No sales data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Sales Overview</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Detailed sales analysis across all stores
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`£${data.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Total Transactions"
            value={data.totalTransactions.toLocaleString()}
          />
          <StatCard
            title="Average Transaction"
            value={`£${data.averageTransaction.toFixed(2)}`}
          />
        </div>

        {/* Top Performers */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Top 5 Performing Stores</h2>
          <div className="space-y-3">
            {data.topStores.map((store, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{store.storeName}</p>
                    <p className="text-sm text-slate-600">{store.transactions} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-900">
                    £{store.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-slate-600">
                    Avg: £{store.avgTransaction.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* All Stores Table */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">All Stores Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">Store Name</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">Platform</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">Total Sales</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">Transactions</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">Avg Transaction</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700 uppercase tracking-wide">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {data.stores.map((store, index) => (
                  <tr key={index} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="py-3 px-4 font-medium text-slate-900">{store.storeName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformBadgeColor(store.platform)}`}>
                        {store.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      £{store.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">{store.transactions.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-slate-700">£{store.avgTransaction.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {((store.totalSales / data.totalSales) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
