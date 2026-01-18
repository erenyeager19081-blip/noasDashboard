'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader } from './ui';

interface SpendData {
  site: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

export default function BuyingSpend() {
  const [spendData, setSpendData] = useState<SpendData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/spend');
      const data = await response.json();
      setSpendData(data);
    } catch (error) {
      console.error('Failed to fetch spend data:', error);
    }
  };

  const totalWeeklySpend = spendData.reduce((sum, s) => sum + (s.week1 || 0), 0);
  const avgFourWeekSpend = spendData.length > 0 
    ? spendData.reduce((sum, s) => sum + ((s.week1 + s.week2 + s.week3 + s.week4) / 4), 0) / spendData.length
    : 0;

  return (
    <section id="buying" className="scroll-mt-6">
      <SectionHeader 
        title="Buying & Spend"
        description="Stock spend and procurement metrics per site"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Weekly Spend (Latest Week)</h3>
          <p className="text-3xl font-bold text-gray-900">£{totalWeeklySpend.toFixed(2)}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Avg 4-Week Spend</h3>
          <p className="text-3xl font-bold text-gray-900">£{avgFourWeekSpend.toFixed(2)}</p>
        </Card>
      </div>

      {spendData.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No spend data yet. Add sales to see estimates.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Site</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Week 1</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Week 2</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Week 3</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Week 4</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">4-Week Avg</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {spendData.map((site, idx) => {
                const fourWeekAvg = ((site.week1 || 0) + (site.week2 || 0) + (site.week3 || 0) + (site.week4 || 0)) / 4;
                return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{site.site}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    £{(site.week1 || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    £{(site.week2 || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    £{(site.week3 || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    £{(site.week4 || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    £{fourWeekAvg.toFixed(2)}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

