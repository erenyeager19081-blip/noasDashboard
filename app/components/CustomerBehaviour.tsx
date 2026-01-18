'use client';

import { useState, useEffect } from 'react';
import { StatCard, Card, Button, Modal, SectionHeader } from './ui';

interface CustomerData {
  new: number;
  returning: number;
}

export default function CustomerBehaviour() {
  const [customerData, setCustomerData] = useState<CustomerData>({
    new: 0,
    returning: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (data && (data.new !== undefined || data.returning !== undefined)) {
        setCustomerData(data);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    }
  };


  const totalCustomers = (customerData.new || 0) + (customerData.returning || 0);
  const newPercent = totalCustomers > 0 
    ? ((customerData.new || 0) / totalCustomers) * 100 
    : 0;
  
  const returningPercent = totalCustomers > 0 
    ? ((customerData.returning || 0) / totalCustomers) * 100 
    : 0;

  return (
    <section id="customers" className="scroll-mt-6">
      <SectionHeader 
        title="Customer Behaviour"
        description="New vs returning customer tracking (via anonymised card usage)"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
        />
        <StatCard
          title="New Customers"
          value={customerData.new || 0}
        />
        <StatCard
          title="Returning Customers"
          value={customerData.returning || 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">New Customers</h3>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Percentage of Total</span>
              <span className="text-sm font-bold text-gray-900">{newPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2" 
                style={{ width: `${newPercent}%` }}
              >
                {newPercent > 10 && (
                  <span className="text-xs font-medium text-white">{newPercent.toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">{customerData.new || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            First-time visitors identified via unique card usage
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Returning Customers</h3>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Percentage of Total</span>
              <span className="text-sm font-bold text-gray-900">{returningPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-600 h-4 rounded-full transition-all duration-300 flex items-center justify-end pr-2" 
                style={{ width: `${returningPercent}%` }}
              >
                {returningPercent > 10 && (
                  <span className="text-xs font-medium text-white">{returningPercent.toFixed(0)}%</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">{customerData.returning || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            Repeat visitors identified via recurring card usage
          </p>
        </Card>
      </div>

      <Card className="p-5 mt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Customer Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-medium text-blue-900 mb-1">Customer Retention</h4>
            <p className="text-2xl font-bold text-blue-700">{returningPercent.toFixed(1)}%</p>
            <p className="text-xs text-blue-600 mt-1">of customers return</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <h4 className="text-sm font-medium text-indigo-900 mb-1">Growth Indicator</h4>
            <p className="text-2xl font-bold text-indigo-700">{newPercent.toFixed(1)}%</p>
            <p className="text-xs text-indigo-600 mt-1">new customer acquisition</p>
          </div>
        </div>
      </Card>
    </section>
  );
}
