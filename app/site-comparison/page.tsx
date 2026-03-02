'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface StoreData {
  storeName: string;
  platform: string;
  totalSales: number;
  totalOrders: number;
  aov: number;
  weekOnWeekChange: number;
  orderGrowth: number;
  currentWeekSales: number;
  lastWeekSales: number;
}

interface SiteComparisonData {
  stores: StoreData[];
  totalSales: number;
  totalOrders: number;
  overallAOV: number;
  storeCount: number;
}

export default function SiteComparisonPage() {
  const [data, setData] = useState<SiteComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'sales' | 'orders' | 'aov' | 'growth'>('sales');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/site-comparison');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch site comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading site comparison...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data || data.stores.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Site Comparison</h1>
          <p className="text-base text-slate-600 mb-8">Compare performance across all stores</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Sort stores based on selected criteria
  const sortedStores = [...data.stores].sort((a, b) => {
    switch (sortBy) {
      case 'sales':
        return b.totalSales - a.totalSales;
      case 'orders':
        return b.totalOrders - a.totalOrders;
      case 'aov':
        return b.aov - a.aov;
      case 'growth':
        return b.weekOnWeekChange - a.weekOnWeekChange;
      default:
        return 0;
    }
  });

  const maxSales = Math.max(...data.stores.map(s => s.totalSales));
  const topPerformer = sortedStores[0];

  return (
    <DashboardLayout>
      <div className="p-8 max-w-full overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Store Performance</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Performance analysis across {data.storeCount} stores
          </p>
        </div>

        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Stores"
            value={data.storeCount.toString()}
          />
          <StatCard
            title="Combined Sales"
            value={`£${data.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Total Orders"
            value={data.totalOrders.toLocaleString()}
          />
          <StatCard
            title="Overall AOV"
            value={`£${data.overallAOV.toFixed(2)}`}
          />
        </div>

        {/* Top Performer Highlight */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-700 mb-1">Top Performing Store</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{topPerformer.storeName}</p>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-slate-600">Total Sales</p>
                  <p className="text-lg font-bold text-slate-900">
                    £{topPerformer.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Orders</p>
                  <p className="text-lg font-bold text-slate-900">{topPerformer.totalOrders.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Growth</p>
                  <p className={`text-lg font-bold ${topPerformer.weekOnWeekChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {topPerformer.weekOnWeekChange >= 0 ? '+' : ''}{topPerformer.weekOnWeekChange.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sort Controls */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">Sort by:</p>
          <div className="flex gap-2">
            {[
              { value: 'sales', label: 'Total Sales' },
              { value: 'orders', label: 'Orders' },
              { value: 'aov', label: 'AOV' },
              { value: 'growth', label: 'Growth' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  sortBy === option.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Store Performance List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Store Performance Rankings</h2>
          <div className="space-y-4">
            {sortedStores.map((store, index) => (
              <div key={store.storeName} className="p-5 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{store.storeName}</h3>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                        {store.platform}
                      </span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    store.weekOnWeekChange >= 0 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-rose-100 text-rose-700'
                  }`}>
                    {store.weekOnWeekChange >= 0 ? '+' : ''}{store.weekOnWeekChange.toFixed(1)}%
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Sales</p>
                    <p className="text-lg font-bold text-slate-900">
                      £{store.totalSales.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Orders</p>
                    <p className="text-lg font-bold text-slate-900">{store.totalOrders.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">AOV</p>
                    <p className="text-lg font-bold text-slate-900">£{store.aov.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">This Week</p>
                    <p className="text-lg font-bold text-slate-900">
                      £{store.currentWeekSales.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Sales Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(store.totalSales / maxSales) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
