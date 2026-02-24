'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card } from '../components/ui';

interface HourlyData {
  hour: number;
  sales: number;
  transactions: number;
}

interface DailyData {
  day: number;
  sales: number;
  transactions: number;
}

interface TimeData {
  hourlyData: HourlyData[];
  dailyData: DailyData[];
  peakHour: number;
  peakDay: number;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimeDemandPage() {
  const [data, setData] = useState<TimeData>({
    hourlyData: [],
    dailyData: [],
    peakHour: 0,
    peakDay: 0
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'hourly' | 'daily'>('hourly');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/time');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const getMaxValue = (dataArray: any[], key: string) => {
    return Math.max(...dataArray.map(d => d[key]));
  };

  const getBarHeight = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading time analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (data.hourlyData.length === 0 && data.dailyData.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Time Analysis</h1>
          <p className="text-base text-slate-600 mb-8">Hourly and daily sales patterns</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No time data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const maxHourlySales = getMaxValue(data.hourlyData, 'sales');
  const maxDailySales = getMaxValue(data.dailyData, 'sales');
  const maxHourlyTransactions = getMaxValue(data.hourlyData, 'transactions');
  const maxDailyTransactions = getMaxValue(data.dailyData, 'transactions');

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Time Analysis</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Sales patterns by hour and day
          </p>
        </div>

        {/* Peak Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-slate-50 border-2 border-blue-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Peak Hour</h3>
            <p className="text-3xl font-bold text-slate-900">{formatHour(data.peakHour)}</p>
            <p className="text-sm text-slate-600 mt-2">Highest sales volume of the day</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-slate-50 border-2 border-emerald-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Peak Day</h3>
            <p className="text-3xl font-bold text-slate-900">{dayNames[data.peakDay]}</p>
            <p className="text-sm text-slate-600 mt-2">Highest sales volume of the week</p>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('hourly')}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              view === 'hourly'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hourly
          </button>
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
        </div>

        {/* Charts */}
        {view === 'hourly' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Hourly Sales Pattern</h2>
            
            {/* Sales Chart */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Sales by Hour</h3>
              <div className="flex items-end justify-between gap-1 h-64 border-b border-l border-slate-200 p-4">
                {data.hourlyData.map((item) => (
                  <div key={item.hour} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.hour === data.peakHour ? 'bg-blue-600' : 'bg-blue-400 hover:bg-blue-500'
                      }`}
                      style={{ height: `${getBarHeight(item.sales, maxHourlySales)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-20 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10 transition-opacity">
                        <p className="font-semibold">{formatHour(item.hour)}</p>
                        <p>Sales: £{item.sales.toFixed(2)}</p>
                        <p>Transactions: {item.transactions}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 transform rotate-0">{item.hour}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Chart */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Transactions by Hour</h3>
              <div className="flex items-end justify-between gap-1 h-64 border-b border-l border-slate-200 p-4">
                {data.hourlyData.map((item) => (
                  <div key={item.hour} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.hour === data.peakHour ? 'bg-emerald-600' : 'bg-emerald-400 hover:bg-emerald-500'
                      }`}
                      style={{ height: `${getBarHeight(item.transactions, maxHourlyTransactions)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10 transition-opacity">
                        <p className="font-semibold">{formatHour(item.hour)}</p>
                        <p>Transactions: {item.transactions}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{item.hour}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {view === 'daily' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Daily Sales Pattern</h2>
            
            {/* Sales Chart */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Sales by Day</h3>
              <div className="flex items-end justify-between gap-4 h-64 border-b border-l border-slate-200 p-4">
                {data.dailyData.map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.day === data.peakDay ? 'bg-blue-600' : 'bg-blue-400 hover:bg-blue-500'
                      }`}
                      style={{ height: `${getBarHeight(item.sales, maxDailySales)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-20 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10 transition-opacity">
                        <p className="font-semibold">{dayNames[item.day] || 'Unknown'}</p>
                        <p>Sales: £{item.sales.toFixed(2)}</p>
                        <p>Transactions: {item.transactions}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-medium">{(dayNames[item.day] || 'N/A').substring(0, 3)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Chart */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Transactions by Day</h3>
              <div className="flex items-end justify-between gap-4 h-64 border-b border-l border-slate-200 p-4">
                {data.dailyData.map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div
                      className={`w-full rounded-t transition-all ${
                        item.day === data.peakDay ? 'bg-emerald-600' : 'bg-emerald-400 hover:bg-emerald-500'
                      }`}
                      style={{ height: `${getBarHeight(item.transactions, maxDailyTransactions)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-10 transition-opacity">
                        <p className="font-semibold">{dayNames[item.day] || 'Unknown'}</p>
                        <p>Transactions: {item.transactions}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-medium">{(dayNames[item.day] || 'N/A').substring(0, 3)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
