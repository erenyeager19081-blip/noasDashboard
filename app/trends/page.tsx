'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface TrendsData {
  dailyTrends: Array<{ date: string; revenue: number; transactions: number; avgValue: number }>;
  weeklyTrends: Array<{ week: string; revenue: number; transactions: number; avgValue: number }>;
  monthlyTrends: Array<{ month: string; revenue: number; transactions: number; avgValue: number }>;
  trendDirection: 'up' | 'down' | 'neutral';
  trendVelocity: number;
  movingAverages: Array<{ date: string; actual: number; ma7: number; ma30: number }>;
  seasonalPatterns: {
    byDayOfWeek: Array<{ day: string; dayNumber: number; revenue: number; transactions: number; avgValue: number }>;
    byMonth: Array<{ month: string; monthNumber: number; revenue: number; transactions: number; avgValue: number }>;
  };
  bestPerformingDay: { date: string; revenue: number; transactions: number } | null;
  worstPerformingDay: { date: string; revenue: number; transactions: number } | null;
  consistencyScore: number;
}

export default function TrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly' | 'seasonal'>('daily');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/trends');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
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

  const formatDate = (dateStr: string) => {
    if (dateStr.includes('W')) {
      return dateStr; // Weekly format
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  const getTrendIcon = (direction: string) => {
    if (direction === 'up') {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (direction === 'down') {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    );
  };

  const getTrendColor = (direction: string) => {
    if (direction === 'up') return 'text-emerald-600';
    if (direction === 'down') return 'text-rose-600';
    return 'text-slate-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading trends analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || data.dailyTrends.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Trends Analytics</h1>
          <p className="text-base text-slate-600 mb-8">Sales patterns and forecasting</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No trends data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const getCurrentTrends = () => {
    if (view === 'weekly') return data.weeklyTrends;
    if (view === 'monthly') return data.monthlyTrends;
    return data.dailyTrends;
  };

  const currentTrends = getCurrentTrends();
  const maxRevenue = Math.max(...currentTrends.map(t => t.revenue));

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Trends Analytics</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Sales patterns, forecasts, and seasonal insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white">
            <p className="text-sm font-semibold text-slate-700 mb-2">Trend Direction</p>
            <div className="flex items-center gap-3">
              <div className={getTrendColor(data.trendDirection)}>
                {getTrendIcon(data.trendDirection)}
              </div>
              <span className={`text-2xl font-bold ${getTrendColor(data.trendDirection)}`}>
                {data.trendDirection.toUpperCase()}
              </span>
            </div>
          </Card>

          <StatCard
            title="Trend Velocity"
            value={`${data.trendVelocity > 0 ? '+' : ''}${data.trendVelocity.toFixed(2)}`}
            suffix="/day"
          />

          <StatCard
            title="Consistency Score"
            value={data.consistencyScore.toFixed(1)}
            suffix="/100"
          />

          {data.bestPerformingDay && (
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white">
              <p className="text-sm font-semibold text-slate-700 mb-2">Best Day</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(data.bestPerformingDay.revenue)}</p>
              <p className="text-sm text-slate-500 mt-1">{formatDate(data.bestPerformingDay.date)}</p>
            </Card>
          )}
        </div>

        {/* View Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('daily')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'daily'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'weekly'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'monthly'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setView('seasonal')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'seasonal'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Seasonal
          </button>
        </div>

        {view !== 'seasonal' ? (
          <>
            {/* Trend Chart - Horizontal Scroll */}
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                {view === 'daily' ? 'Daily' : view === 'weekly' ? 'Weekly' : 'Monthly'} Trends
              </h3>
              <div className="relative">
                <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                  <div className="flex gap-6 min-w-max px-2">
                    {[...currentTrends].reverse().map((item, index) => {
                      const heightPercent = (item.revenue / maxRevenue) * 100;
                      const dateKey = 'date' in item ? item.date : 'week' in item ? item.week : item.month;
                      
                      return (
                        <div key={index} className="flex flex-col items-center min-w-[100px]">
                          <div className="text-xs font-semibold text-slate-700 mb-3">
                            {view === 'weekly' ? dateKey : view === 'monthly' ? dateKey : formatDate(dateKey)}
                          </div>
                          <div className="flex flex-col items-center justify-end h-64 relative">
                            <div className="absolute top-0 text-xs font-bold text-slate-900">
                              {formatCurrency(item.revenue).replace(/\.\d+$/, '')}
                            </div>
                            <div 
                              className="w-20 bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-t-lg transition-all duration-700 hover:from-indigo-600 hover:to-indigo-700 cursor-pointer relative group"
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

            {/* Moving Averages (only for daily view) */}
            {view === 'daily' && data.movingAverages.length > 0 && (
              <Card className="p-6 mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Moving Averages</h3>
                <div className="space-y-3">
                  {data.movingAverages.slice(-14).map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm font-medium text-slate-600">
                        {formatDate(item.date)}
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Actual</p>
                          <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.actual)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">7-Day MA</p>
                          <p className="text-sm font-semibold text-blue-600">{formatCurrency(item.ma7)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">30-Day MA</p>
                          <p className="text-sm font-semibold text-purple-600">{formatCurrency(item.ma30)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Seasonal Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* By Day of Week */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Performance by Day of Week</h3>
                <div className="relative">
                  <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                    <div className="flex gap-6 min-w-max px-2 justify-center md:justify-start">
                      {data.seasonalPatterns.byDayOfWeek.map((day, index) => {
                        const maxDayRevenue = Math.max(...data.seasonalPatterns.byDayOfWeek.map(d => d.revenue));
                        const heightPercent = (day.revenue / maxDayRevenue) * 100;
                        
                        return (
                          <div key={index} className="flex flex-col items-center min-w-[90px]">
                            <div className="text-sm font-semibold text-slate-700 mb-3">
                              {day.day}
                            </div>
                            <div className="flex flex-col items-center justify-end h-64 relative">
                              <div className="absolute top-0 text-xs font-bold text-slate-900">
                                {formatCurrency(day.revenue).replace(/\.\d+$/, '')}
                              </div>
                              <div 
                                className="w-16 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-700 hover:from-blue-600 hover:to-blue-700 cursor-pointer relative group"
                                style={{ 
                                  height: `${Math.max(heightPercent, 8)}%`,
                                  minHeight: '20px'
                                }}
                              >
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {day.transactions}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                {day.transactions} sales
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>

              {/* By Month - Horizontal Scroll */}
              {data.seasonalPatterns.byMonth.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Performance by Month</h3>
                  <div className="relative">
                    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                      <div className="flex gap-6 min-w-max px-2">
                        {[...data.seasonalPatterns.byMonth].reverse().map((month, index) => {
                          const maxMonthRevenue = Math.max(...data.seasonalPatterns.byMonth.map(m => m.revenue));
                          const heightPercent = (month.revenue / maxMonthRevenue) * 100;
                          
                          return (
                            <div key={index} className="flex flex-col items-center min-w-[90px]">
                              <div className="text-sm font-semibold text-slate-700 mb-3">
                                {month.month.substring(0, 3)}
                              </div>
                              <div className="flex flex-col items-center justify-end h-64 relative">
                                <div className="absolute top-0 text-xs font-bold text-slate-900">
                                  {formatCurrency(month.revenue).replace(/\.\d+$/, '')}
                                </div>
                                <div 
                                  className="w-16 bg-gradient-to-t from-emerald-500 to-emerald-600 rounded-t-lg transition-all duration-700 hover:from-emerald-600 hover:to-emerald-700 cursor-pointer relative group"
                                  style={{ 
                                    height: `${Math.max(heightPercent, 8)}%`,
                                    minHeight: '20px'
                                  }}
                                >
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                      {month.transactions}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                  {month.transactions} sales
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
