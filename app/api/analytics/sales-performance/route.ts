import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        totalSales: 0,
        ordersCount: 0,
        aov: 0,
        weekOnWeekChange: 0,
        currentWeekSales: 0,
        lastWeekSales: 0
      });
    }

    // Get current date and calculate week boundaries
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    currentWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(currentWeekStart);
    lastWeekEnd.setHours(0, 0, 0, 0);

    // Overall metrics
    const totalSales = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const ordersCount = transactions.length;
    const aov = totalSales / ordersCount;

    // Current week transactions
    const currentWeekTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= currentWeekStart && date <= now;
    });

    // Last week transactions
    const lastWeekTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= lastWeekStart && date < lastWeekEnd;
    });

    const currentWeekSales = currentWeekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const lastWeekSales = lastWeekTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate week-on-week percentage change
    const weekOnWeekChange = lastWeekSales > 0 
      ? ((currentWeekSales - lastWeekSales) / lastWeekSales) * 100 
      : 0;

    // Daily breakdown for current week
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      
      const dayTransactions = currentWeekTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.toDateString() === day.toDateString();
      });

      const daySales = dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      dailyBreakdown.push({
        date: day.toISOString(),
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getDay()],
        sales: daySales,
        orders: dayTransactions.length
      });
    }

    return NextResponse.json({
      totalSales,
      ordersCount,
      aov,
      weekOnWeekChange,
      currentWeekSales,
      lastWeekSales,
      currentWeekOrders: currentWeekTransactions.length,
      lastWeekOrders: lastWeekTransactions.length,
      dailyBreakdown
    });
  } catch (error) {
    console.error('Failed to fetch sales performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales performance' },
      { status: 500 }
    );
  }
}
