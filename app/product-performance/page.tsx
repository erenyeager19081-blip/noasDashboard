'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, StatCard } from '../components/ui';

interface ProductData {
  name: string;
  revenue: number;
  quantity: number;
  category: string;
  rank: number;
  avgPrice: number;
}

interface ProductPerformanceData {
  topProducts: ProductData[];
  bottomProducts: ProductData[];
  categorySplit: { Food: number; Drinks: number; Other: number };
  categorySplitPercentage: { Food: number; Drinks: number; Other: number };
  totalProducts: number;
  hasProductData: boolean;
  message?: string;
}

export default function ProductPerformancePage() {
  const [data, setData] = useState<ProductPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/product-performance');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch product performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading product performance...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Product Performance</h1>
          <p className="text-base text-slate-600 mb-8">Top and bottom performing products</p>
          <Card className="p-12 text-center">
            <p className="text-slate-600">No data available. Please upload data files first.</p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!data.hasProductData) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Product Performance</h1>
            <p className="text-base text-slate-600 mt-2 font-medium">
              Analyze top and bottom performing products
            </p>
          </div>

          <Card className="p-12 text-center border-amber-200 bg-amber-50">
            <svg className="w-16 h-16 text-amber-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-semibold text-slate-900 mb-2">Product Data Not Available</p>
            <p className="text-slate-600 max-w-xl mx-auto">
              {data.message || 'Upload files with product/item columns for detailed product analytics.'}
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const totalCategorySales = data.categorySplit.Food + data.categorySplit.Drinks + data.categorySplit.Other;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Product Performance</h1>
          <p className="text-base text-slate-600 mt-2 font-medium">
            Analyze {data.totalProducts} products across categories
          </p>
        </div>

        {/* Category Split */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Category Revenue Split</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <p className="text-sm font-semibold text-orange-700 mb-2">Food</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                £{data.categorySplit.Food.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-600">{data.categorySplitPercentage.Food.toFixed(1)}% of total</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-2">Drinks</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                £{data.categorySplit.Drinks.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-600">{data.categorySplitPercentage.Drinks.toFixed(1)}% of total</p>
            </div>

            <div className="p-5 bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg border border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">Other</p>
              <p className="text-3xl font-bold text-slate-900 mb-1">
                £{data.categorySplit.Other.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-slate-600">{data.categorySplitPercentage.Other.toFixed(1)}% of total</p>
            </div>
          </div>

          {/* Visual Category Bar */}
          <div className="w-full h-8 flex rounded-lg overflow-hidden">
            {data.categorySplitPercentage.Food > 0 && (
              <div 
                className="bg-gradient-to-r from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${data.categorySplitPercentage.Food}%` }}
              >
                {data.categorySplitPercentage.Food > 15 && 'Food'}
              </div>
            )}
            {data.categorySplitPercentage.Drinks > 0 && (
              <div 
                className="bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${data.categorySplitPercentage.Drinks}%` }}
              >
                {data.categorySplitPercentage.Drinks > 15 && 'Drinks'}
              </div>
            )}
            {data.categorySplitPercentage.Other > 0 && (
              <div 
                className="bg-gradient-to-r from-slate-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold"
                style={{ width: `${data.categorySplitPercentage.Other}%` }}
              >
                {data.categorySplitPercentage.Other > 15 && 'Other'}
              </div>
            )}
          </div>
        </Card>

        {/* Top and Bottom Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Products */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Top 5 Products</h2>
            </div>
            <div className="space-y-3">
              {data.topProducts.map((product) => (
                <div key={product.name} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-white text-slate-700 font-medium">
                          {product.category}
                        </span>
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      {product.rank}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-xs text-slate-600">Revenue</p>
                      <p className="text-sm font-bold text-slate-900">
                        £{product.revenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Quantity</p>
                      <p className="text-sm font-bold text-slate-900">{product.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Avg Price</p>
                      <p className="text-sm font-bold text-slate-900">£{product.avgPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Bottom 5 Products */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.981-1.742 2.981H4.42c-1.53 0-2.493-1.647-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Bottom 5 Products</h2>
            </div>
            <div className="space-y-3">
              {data.bottomProducts.map((product) => (
                <div key={product.name} className="p-4 bg-rose-50 rounded-lg border border-rose-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded bg-white text-slate-700 font-medium">
                          {product.category}
                        </span>
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold text-sm">
                      {product.rank}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-xs text-slate-600">Revenue</p>
                      <p className="text-sm font-bold text-slate-900">
                        £{product.revenue.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Quantity</p>
                      <p className="text-sm font-bold text-slate-900">{product.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Avg Price</p>
                      <p className="text-sm font-bold text-slate-900">£{product.avgPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
