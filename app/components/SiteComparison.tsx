'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader } from './ui';

interface SiteData {
  name: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export default function SiteComparison() {
  const [sites, setSites] = useState<SiteData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();
      setSites(data);
    } catch (error) {
      console.error('Failed to fetch sites:', error);
    }
  };

  const saveData = async (newSites: SiteData[]) => {
    try {
      await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSites),
      });
    } catch (error) {
      console.error('Failed to save sites:', error);
    }
  };


  return (
    <section id="sites" className="scroll-mt-6">
      <SectionHeader 
        title="Site Comparison"
        description="Performance metrics across different café locations"
      />

      {sites.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No site data yet. Add sales to see site metrics.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sites.map((site, idx) => (
            <Card key={idx} className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">{site.name}</h3>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-xl font-bold text-gray-900">£{(site.revenue || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Orders</p>
                  <p className="text-xl font-bold text-gray-900">{site.orders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">AOV</p>
                  <p className="text-xl font-bold text-gray-900">£{(site.avgOrderValue || 0).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
