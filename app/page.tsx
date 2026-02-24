'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { Card, StatCard } from './components/ui';

interface DashboardStats {
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  totalStores: number;
  lastUploadDate: string | null;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    totalStores: 0,
    lastUploadDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            View consolidated statistics from all 15 stores
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sales"
            value={`£${stats.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions.toLocaleString()}
          />
          <StatCard
            title="Average Transaction"
            value={`£${stats.averageTransaction.toFixed(2)}`}
          />
          <StatCard
            title="Active Stores"
            value={stats.totalStores.toString()}
          />
        </div>

        {/* Last Upload Info */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Data Status</h3>
              <p className="text-sm text-slate-600">
                {stats.lastUploadDate 
                  ? `Last uploaded: ${new Date(stats.lastUploadDate).toLocaleString('en-GB', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}`
                  : 'No data uploaded yet'}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Info */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Supported Platforms</h3>
            <p className="text-sm text-slate-600">
              TakeMyPayments and Booker payment systems are currently supported.
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-slate-700 mb-2">Supported Formats</h3>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">.xlsx</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">.xls</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">.csv</span>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
