'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface SalesPerformanceData {
  totalSales: number;
  ordersCount: number;
  aov: number;
  weekOnWeekChange: number;
  currentWeekSales: number;
  lastWeekSales: number;
  currentWeekOrders: number;
  lastWeekOrders: number;
  dailyBreakdown: {
    date: string;
    dayName: string;
    sales: number;
    orders: number;
  }[];
}

export default function SalesPerformancePage() {
  const [data, setData] = useState<SalesPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/sales-performance');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch sales performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading sales performance...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Sales Performance</h1>
          <p className="text-base text-slate-600 mb-8">Key performance metrics</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const maxDailySales = Math.max(...data.dailyBreakdown.map(d => d.sales));

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Sales Performance</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Track revenue, orders, and growth metrics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sales"
            value={`£${data.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Total Orders"
            value={data.ordersCount.toLocaleString()}
          />
          <StatCard
            title="Average Order Value"
            value={`£${data.aov.toFixed(2)}`}
          />
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <p className="text-sm font-semibold text-slate-600 mb-2">Week-on-Week</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold ${data.weekOnWeekChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {data.weekOnWeekChange >= 0 ? '+' : ''}{data.weekOnWeekChange.toFixed(1)}%
              </p>
              {data.weekOnWeekChange >= 0 ? (
                <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </Card>
        </div>

        {/* Weekly Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Weekly Comparison</h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Current Week Sales</span>
                  <span className="text-lg font-bold text-slate-900">
                    £{data.currentWeekSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: '100%' }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{data.currentWeekOrders} orders</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Last Week Sales</span>
                  <span className="text-lg font-bold text-slate-900">
                    £{data.lastWeekSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-slate-400 to-slate-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: data.currentWeekSales > 0 ? `${(data.lastWeekSales / data.currentWeekSales) * 100}%` : '100%' }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{data.lastWeekOrders} orders</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Growth Insights</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Revenue Trend</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {data.weekOnWeekChange >= 0 
                      ? `Sales are up ${data.weekOnWeekChange.toFixed(1)}% compared to last week`
                      : `Sales are down ${Math.abs(data.weekOnWeekChange).toFixed(1)}% compared to last week`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Order Volume</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Processing {data.ordersCount.toLocaleString()} orders with £{data.aov.toFixed(2)} average value
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Daily Breakdown - Horizontal Scroll */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Current Week Daily Performance</h2>
          <div className="relative max-w-full overflow-hidden">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <div className="flex gap-6 min-w-max px-2">
                {[...data.dailyBreakdown].reverse().map((day) => (
                  <div key={day.date} className="flex flex-col items-center min-w-[100px]">
                    <div className="text-xs font-semibold text-slate-600 mb-2">
                      {day.dayName}
                    </div>
                    <div className="text-xs text-slate-500 mb-3">
                      {new Date(day.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex flex-col items-center justify-end h-64 relative">
                      <div className="absolute top-0 text-xs font-bold text-slate-900 mb-2">
                        £{day.sales.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                      </div>
                      <div 
                        className="w-16 bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-lg transition-all duration-700 hover:from-indigo-600 hover:to-purple-700 cursor-pointer relative group"
                        style={{ 
                          height: maxDailySales > 0 ? `${Math.max((day.sales / maxDailySales) * 100, 8)}%` : '8%',
                          minHeight: '20px'
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.orders}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {day.orders} orders
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
