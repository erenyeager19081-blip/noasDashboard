'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface CustomerBehaviourData {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  repeatRate: number;
  avgPurchasesPerCustomer: number;
  maxPurchases: number;
  frequencySegments: {
    oneTime: number;
    twotoFive: number;
    sixToTen: number;
    moreThanTen: number;
  };
  hasCustomerData: boolean;
  message?: string;
}

export default function CustomerBehaviourPage() {
  const [data, setData] = useState<CustomerBehaviourData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/customer-behaviour');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch customer behaviour:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading customer behaviour...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Customer Behaviour</h1>
          <p className="text-base text-slate-600 mb-8">New vs returning customer analysis</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!data.hasCustomerData) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Customer Behaviour</h1>
            <p className="text-base text-slate-600 mt-2 font-medium">
              Track customer loyalty and repeat purchase patterns
            </p>
          </div>

          <Card className="p-12 text-center border-amber-200 bg-amber-50">
            <svg className="w-16 h-16 text-amber-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-semibold text-slate-900 mb-2">Customer Data Not Available</p>
            <p className="text-slate-600 max-w-xl mx-auto">
              {data.message || 'Upload files with customer/card ID columns for customer behaviour analytics.'}
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalSegments = data.frequencySegments.oneTime + data.frequencySegments.twotoFive + 
                        data.frequencySegments.sixToTen + data.frequencySegments.moreThanTen;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Customer Behaviour</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Analyze {data.totalCustomers.toLocaleString()} customers and purchase patterns
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Customers identified via anonymized recurring card usage
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Customers"
            value={data.totalCustomers.toLocaleString()}
          />
          <StatCard
            title="New Customers"
            value={data.newCustomers.toLocaleString()}
          />
          <StatCard
            title="Returning Customers"
            value={data.returningCustomers.toLocaleString()}
          />
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <p className="text-sm font-semibold text-slate-600 mb-2">Repeat Rate</p>
            <p className="text-3xl font-bold text-purple-700">{data.repeatRate.toFixed(1)}%</p>
          </Card>
        </div>

        {/* Customer Split Visualization */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Customer Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-700">New Customers (1 visit)</span>
                <span className="text-2xl font-bold text-blue-600">{data.newCustomers}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-6">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                  style={{ width: `${(data.newCustomers / data.totalCustomers) * 100}%` }}
                >
                  {((data.newCustomers / data.totalCustomers) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-700">Returning Customers (2+ visits)</span>
                <span className="text-2xl font-bold text-emerald-600">{data.returningCustomers}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-6">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                  style={{ width: `${(data.returningCustomers / data.totalCustomers) * 100}%` }}
                >
                  {((data.returningCustomers / data.totalCustomers) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Purchase Frequency Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Purchase Insights</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Average Visits</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {data.avgPurchasesPerCustomer.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">purchases per customer</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Most Loyal Customer</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{data.maxPurchases}</p>
                  <p className="text-xs text-slate-600 mt-1">total purchases</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Loyalty Segments</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">One-Time Customers</span>
                  <span className="text-lg font-bold text-slate-900">{data.frequencySegments.oneTime}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-slate-400 to-slate-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: totalSegments > 0 ? `${(data.frequencySegments.oneTime / totalSegments) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">2-5 Visits</span>
                  <span className="text-lg font-bold text-slate-900">{data.frequencySegments.twotoFive}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: totalSegments > 0 ? `${(data.frequencySegments.twotoFive / totalSegments) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">6-10 Visits</span>
                  <span className="text-lg font-bold text-slate-900">{data.frequencySegments.sixToTen}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: totalSegments > 0 ? `${(data.frequencySegments.sixToTen / totalSegments) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">10+ Visits (VIP)</span>
                  <span className="text-lg font-bold text-slate-900">{data.frequencySegments.moreThanTen}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: totalSegments > 0 ? `${(data.frequencySegments.moreThanTen / totalSegments) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Actionable Insights */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">💡 Key Insights</h2>
          <div className="space-y-2 text-sm text-slate-700">
            <p>• {data.repeatRate.toFixed(1)}% of customers return for multiple visits</p>
            <p>• Average customer makes {data.avgPurchasesPerCustomer.toFixed(1)} purchases</p>
            <p>• {data.frequencySegments.moreThanTen} VIP customers with 10+ visits drive loyalty</p>
            <p>• Focus on converting {data.newCustomers} one-time customers into repeat visitors</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
