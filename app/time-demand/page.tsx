'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface TimeDemandData {
  salesByHour: {
    hour: number;
    displayHour: string;
    sales: number;
    orders: number;
    avgOrderValue: number;
  }[];
  salesByDayOfWeek: {
    day: number;
    dayName: string;
    sales: number;
    orders: number;
    avgOrderValue: number;
  }[];
  busiestPeriod: {
    hour: number;
    displayHour: string;
    orders: number;
    sales: number;
  } | null;
  quietestPeriod: {
    hour: number;
    displayHour: string;
    orders: number;
    sales: number;
  } | null;
}

export default function TimeDemandPage() {
  const [data, setData] = useState<TimeDemandData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/time-demand');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch time demand data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading time demand analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Time-Based Demand</h1>
          <p className="text-base text-slate-600 mb-8">Sales patterns by hour and day</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const maxHourlySales = Math.max(...data.salesByHour.map(h => h.sales));
  const maxDailySales = Math.max(...data.salesByDayOfWeek.map(d => d.sales));

  return (
    <DashboardLayout>
      <div className="p-8 max-w-full overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Time-Based Demand</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Understand peak hours and daily patterns
          </p>
        </div>

        {/* Peak Hours Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {data.busiestPeriod && (
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-700 mb-1">Busiest Period</p>
                  <p className="text-3xl font-bold text-slate-900">{data.busiestPeriod.displayHour}</p>
                  <p className="text-sm text-slate-600 mt-2">
                    {data.busiestPeriod.orders} orders · £{data.busiestPeriod.sales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {data.quietestPeriod && (
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-700 mb-1">Quietest Period</p>
                  <p className="text-3xl font-bold text-slate-900">{data.quietestPeriod.displayHour}</p>
                  <p className="text-sm text-slate-600 mt-2">
                    {data.quietestPeriod.orders} orders · £{data.quietestPeriod.sales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sales by Hour - Horizontal Scroll */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Sales by Hour</h2>
          <div className="relative max-w-full overflow-hidden">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <div className="flex gap-4 min-w-max px-2">
                {[...data.salesByHour].reverse().filter(h => h.orders > 0).map((hour) => (
                  <div key={hour.hour} className="flex flex-col items-center min-w-[70px]">
                    <div className="text-xs font-semibold text-slate-700 mb-3">
                      {hour.displayHour}
                    </div>
                    <div className="flex flex-col items-center justify-end h-64 relative">
                      <div className="absolute top-0 text-xs font-bold text-slate-900">
                        £{hour.sales.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                      </div>
                      <div 
                        className="w-14 bg-gradient-to-t from-violet-500 to-purple-600 rounded-t-lg transition-all duration-700 hover:from-violet-600 hover:to-purple-700 cursor-pointer relative group"
                        style={{ 
                          height: maxHourlySales > 0 ? `${Math.max((hour.sales / maxHourlySales) * 100, 8)}%` : '8%',
                          minHeight: '20px'
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {hour.orders}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        {hour.orders}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Sales by Day of Week - Horizontal Scroll */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Sales by Day of Week</h2>
          <div className="relative max-w-full overflow-hidden">
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <div className="flex gap-6 min-w-max px-2 justify-center md:justify-start">
                {data.salesByDayOfWeek.map((day) => (
                  <div key={day.day} className="flex flex-col items-center min-w-[100px]">
                    <p className="text-sm font-semibold text-slate-700 mb-3">{day.dayName}</p>
                    <div className="flex flex-col items-center justify-end h-64 relative">
                      <div className="absolute top-0 text-xs font-bold text-slate-900 mb-2">
                        £{day.sales.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                      </div>
                      <div 
                        className="w-20 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all duration-700 hover:from-indigo-600 hover:to-indigo-500 cursor-pointer relative group"
                        style={{ 
                          height: maxDailySales > 0 ? `${Math.max((day.sales / maxDailySales) * 100, 8)}%` : '8%',
                          minHeight: '40px'
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {day.orders}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-xs text-slate-500">
                          {day.orders} orders
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          AOV: £{day.avgOrderValue.toFixed(2)}
                        </p>
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
