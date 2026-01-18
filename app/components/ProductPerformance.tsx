'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader } from './ui';

interface ProductData {
  name: string;
  revenue: number;
  category: 'food' | 'drink';
}

export default function ProductPerformance() {
  const [products, setProducts] = useState<ProductData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const sortedProducts = [...products].sort((a, b) => b.revenue - a.revenue);
  const topProducts = sortedProducts.slice(0, 5);
  const bottomProducts = sortedProducts.slice(-5).reverse();

  const foodRevenue = products
    .filter(p => p.category === 'food')
    .reduce((sum, p) => sum + p.revenue, 0);
  
  const drinksRevenue = products
    .filter(p => p.category === 'drink')
    .reduce((sum, p) => sum + p.revenue, 0);

  const totalRevenue = foodRevenue + drinksRevenue;
  const foodPercent = totalRevenue > 0 ? (foodRevenue / totalRevenue) * 100 : 0;
  const drinksPercent = totalRevenue > 0 ? (drinksRevenue / totalRevenue) * 100 : 0;

  return (
    <section id="products" className="scroll-mt-6">
      <SectionHeader 
        title="Product Performance"
        description="Revenue analysis by products and categories"
      />

      {/* Category Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Food Revenue</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">£{foodRevenue.toFixed(2)}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${foodPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{foodPercent.toFixed(1)}% of total revenue</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Drinks Revenue</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">£{drinksRevenue.toFixed(2)}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${drinksPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{drinksPercent.toFixed(1)}% of total revenue</p>
        </Card>
      </div>

      {products.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No product data yet. Add sales to see products.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top 5 Products */}
          <Card className="p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Top 5 Products by Revenue
            </h3>
            <div className="space-y-3">
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Add at least 5 products</p>
              ) : (
                topProducts.map((product, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <p className="font-bold text-green-700">£{product.revenue.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Bottom 5 Products */}
          <Card className="p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Bottom 5 Products by Revenue
            </h3>
            <div className="space-y-3">
              {bottomProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Add at least 5 products</p>
              ) : (
                bottomProducts.map((product, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <p className="font-bold text-red-700">£{product.revenue.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* All Products Table */}
      {products.length > 0 && (
        <Card className="p-5 mt-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">All Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        product.category === 'food' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">
                      £{product.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
