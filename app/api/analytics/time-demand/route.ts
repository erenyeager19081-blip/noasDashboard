import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        salesByHour: [],
        ordersByHour: [],
        salesByDayOfWeek: [],
        busiestPeriod: null,
        quietestPeriod: null
      });
    }

    // Initialize hourly data (0-23 hours)
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      displayHour: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
      sales: 0,
      orders: 0
    }));

    // Initialize day of week data (0=Sunday to 6=Saturday)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekData = dayNames.map((name, index) => ({
      day: index,
      dayName: name,
      sales: 0,
      orders: 0
    }));

    // Aggregate data
    transactions.forEach(t => {
      const hour = t.hour !== undefined ? t.hour : new Date(t.date).getHours();
      const dayOfWeek = t.dayOfWeek !== undefined ? t.dayOfWeek : new Date(t.date).getDay();
      const amount = t.amount || 0;

      // Hourly aggregation
      if (hour >= 0 && hour < 24) {
        hourlyData[hour].sales += amount;
        hourlyData[hour].orders += 1;
      }

      // Day of week aggregation
      if (dayOfWeek >= 0 && dayOfWeek < 7) {
        dayOfWeekData[dayOfWeek].sales += amount;
        dayOfWeekData[dayOfWeek].orders += 1;
      }
    });

    // Find busiest and quietest periods (by order count)
    const nonZeroHours = hourlyData.filter(h => h.orders > 0);
    const busiestHour = nonZeroHours.reduce((max, h) => h.orders > max.orders ? h : max, nonZeroHours[0]);
    const quietestHour = nonZeroHours.reduce((min, h) => h.orders < min.orders ? h : min, nonZeroHours[0]);

    // Calculate average order value per hour
    const salesByHour = hourlyData.map(h => ({
      ...h,
      avgOrderValue: h.orders > 0 ? h.sales / h.orders : 0
    }));

    // Calculate average order value per day
    const salesByDayOfWeek = dayOfWeekData.map(d => ({
      ...d,
      avgOrderValue: d.orders > 0 ? d.sales / d.orders : 0
    }));

    return NextResponse.json({
      salesByHour,
      ordersByHour: hourlyData.map(h => ({ hour: h.hour, displayHour: h.displayHour, orders: h.orders })),
      salesByDayOfWeek,
      busiestPeriod: busiestHour ? {
        hour: busiestHour.hour,
        displayHour: busiestHour.displayHour,
        orders: busiestHour.orders,
        sales: busiestHour.sales
      } : null,
      quietestPeriod: quietestHour ? {
        hour: quietestHour.hour,
        displayHour: quietestHour.displayHour,
        orders: quietestHour.orders,
        sales: quietestHour.sales
      } : null
    });
  } catch (error) {
    console.error('Failed to fetch time-based demand:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-based demand' },
      { status: 500 }
    );
  }
}
