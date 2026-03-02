'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface RevenueData {
  totalRevenue: number;
  revenueByPeriod: Array<{ date: string; revenue: number; transactions: number }>;
  revenueByPlatform: Array<{ platform: string; revenue: number; transactions: number; avgValue: number; percentage: number }>;
  revenueGrowth: number;
  averageOrderValue: number;
  projectedRevenue: number;
  periodComparison: {
    current: { revenue: number; transactions: number };
    previous: { revenue: number; transactions: number };
    change: { revenue: number; revenuePercent: number; transactions: number; transactionPercent: number };
  } | null;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/revenue?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'takemypayments':
        return 'from-blue-500 to-blue-600';
      case 'booker':
        return 'from-emerald-500 to-emerald-600';
      case 'paypal':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-slate-500 to-slate-600';
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

  const formatDate = (dateStr: string) => {
    if (period === 'weekly') {
      return dateStr; // Already formatted as "2024-W01"
    } else if (period === 'monthly') {
      const [year, month] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    } else {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading revenue analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || data.totalRevenue === 0) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Revenue Analytics</h1>
          <p className="text-base text-slate-600 mb-8">Comprehensive revenue insights</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No revenue data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const maxRevenue = Math.max(...data.revenueByPeriod.map(p => p.revenue));

  return (
    <DashboardLayout>
      <div className="p-8 max-w-full overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Revenue Breakdown</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Comprehensive revenue tracking and insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(data.totalRevenue)}
            change={data.revenueGrowth}
          />
          <StatCard
            title="Average Order Value"
            value={formatCurrency(data.averageOrderValue)}
          />
          <StatCard
            title="Revenue Growth"
            value={`${data.revenueGrowth.toFixed(1)}%`}
          />
          <StatCard
            title="Projected Revenue"
            value={formatCurrency(data.projectedRevenue)}
          />
        </div>

        {/* Period Comparison */}
        {data.periodComparison && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-slate-50 to-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Period Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-2">Current Period</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.periodComparison.current.revenue)}</p>
                <p className="text-sm text-slate-500">{data.periodComparison.current.transactions} transactions</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">Previous Period</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(data.periodComparison.previous.revenue)}</p>
                <p className="text-sm text-slate-500">{data.periodComparison.previous.transactions} transactions</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  data.periodComparison.change.revenuePercent > 0
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                }`}>
                  {data.periodComparison.change.revenuePercent > 0 ? '↑' : '↓'} {Math.abs(data.periodComparison.change.revenuePercent).toFixed(1)}% Revenue
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  data.periodComparison.change.transactionPercent > 0
                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                }`}>
                  {data.periodComparison.change.transactionPercent > 0 ? '↑' : '↓'} {Math.abs(data.periodComparison.change.transactionPercent).toFixed(1)}% Transactions
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Period Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              period === 'daily'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              period === 'weekly'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              period === 'monthly'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Revenue Chart - Horizontal Scroll */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Trend - {period.charAt(0).toUpperCase() + period.slice(1)}</h3>
          <div className="relative max-w-full overflow-hidden">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <div className="flex gap-6 min-w-max px-2">
                {[...data.revenueByPeriod].reverse().map((item, index) => {
                  const heightPercent = (item.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="flex flex-col items-center min-w-[100px]">
                      <div className="text-xs font-semibold text-slate-700 mb-3">
                        {formatDate(item.date)}
                      </div>
                      <div className="flex flex-col items-center justify-end h-64 relative">
                        <div className="absolute top-0 text-xs font-bold text-slate-900">
                          {formatCurrency(item.revenue).replace(/\.\d+$/, '')}
                        </div>
                        <div 
                          className="w-20 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-700 hover:from-blue-600 hover:to-blue-700 cursor-pointer relative group"
                          style={{ 
                            height: `${Math.max(heightPercent, 8)}%`,
                            minHeight: '20px'
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.transactions}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {item.transactions} sales
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Platform Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue by Platform</h3>
          <div className="space-y-6">
            {data.revenueByPlatform.map((platform, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlatformBadgeColor(platform.platform)}`}>
                      {platform.platform}
                    </span>
                    <span className="text-sm text-slate-600">
                      {platform.transactions} transactions
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">
                      {formatCurrency(platform.revenue)}
                    </span>
                    <span className="text-sm text-slate-500 ml-2">
                      ({platform.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${getPlatformColor(platform.platform)} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${platform.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-1 text-right text-sm text-slate-500">
                  Avg: {formatCurrency(platform.avgValue)} per transaction
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
