'use client';

import { useState, useEffect } from 'react';
import { Card, SectionHeader } from './ui';

interface HourlyData {
  hour: number;
  sales: number;
  orders: number;
}

interface DayData {
  day: string;
  sales: number;
}

export default function TimeDemand() {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [dayData, setDayData] = useState<DayData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hourlyRes, dailyRes] = await Promise.all([
        fetch('/api/time-demand/hourly'),
        fetch('/api/time-demand/daily')
      ]);
      const hourly = await hourlyRes.json();
      const daily = await dailyRes.json();
      setHourlyData(hourly);
      setDayData(daily);
    } catch (error) {
      console.error('Failed to fetch time demand data:', error);
    }
  };

  const getBusiestPeriod = () => {
    if (hourlyData.length === 0) return 'N/A';
    const max = hourlyData.reduce((prev, curr) => prev.sales > curr.sales ? prev : curr);
    return `${max.hour}:00 (£${max.sales.toFixed(2)})`;
  };

  const getQuietestPeriod = () => {
    if (hourlyData.length === 0) return 'N/A';
    const min = hourlyData.reduce((prev, curr) => prev.sales < curr.sales ? prev : curr);
    return `${min.hour}:00 (£${min.sales.toFixed(2)})`;
  };



  const updateDayData = (index: number, value: number) => {
    const updated = [...dayData];
    updated[index].sales = value;
    setDayData(updated);
  };

  return (
    <section id="time-demand" className="scroll-mt-6">
      <SectionHeader 
        title="Time-Based Demand"
        description="Sales patterns across different time periods"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Busiest Period</h3>
          </div>
          <p className="text-xl font-bold text-blue-600">{getBusiestPeriod()}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Quietest Period</h3>
          </div>
          <p className="text-xl font-bold text-blue-600">{getQuietestPeriod()}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales by Hour */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Sales by Hour</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {hourlyData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data yet. Add sales to see patterns.</p>
            ) : (
              hourlyData.map((data, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{data.hour}:00</span>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">£{data.sales.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Sales by Day */}
        <Card className="p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Sales by Day of Week</h3>
          <div className="space-y-2">
            {dayData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data yet. Add sales to see patterns.</p>
            ) : (
              dayData.map((data, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{data.day}</span>
                  <span className="font-bold text-gray-900">£{data.sales.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
