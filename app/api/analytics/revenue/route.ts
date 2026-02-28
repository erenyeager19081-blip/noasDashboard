import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly

    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        revenueByPeriod: [],
        revenueByPlatform: [],
        revenueGrowth: 0,
        averageOrderValue: 0,
        projectedRevenue: 0,
        platformBreakdown: {},
        periodComparison: null
      });
    }

    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const averageOrderValue = totalRevenue / transactions.length;

    // Sort transactions by date
    const sortedTransactions = transactions
      .map((t: any) => ({ ...t, date: new Date(t.date) }))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    // Revenue by platform
    const platformRevenue: Record<string, { revenue: number; transactions: number; avgValue: number }> = {};
    transactions.forEach((t: any) => {
      if (!platformRevenue[t.platform]) {
        platformRevenue[t.platform] = { revenue: 0, transactions: 0, avgValue: 0 };
      }
      platformRevenue[t.platform].revenue += t.amount || 0;
      platformRevenue[t.platform].transactions += 1;
    });

    // Calculate averages for each platform
    Object.keys(platformRevenue).forEach(platform => {
      platformRevenue[platform].avgValue = 
        platformRevenue[platform].revenue / platformRevenue[platform].transactions;
    });

    const revenueByPlatform = Object.entries(platformRevenue).map(([platform, data]) => ({
      platform,
      ...data,
      percentage: (data.revenue / totalRevenue) * 100
    }));

    // Group revenue by period
    const revenueByPeriod = groupByPeriod(sortedTransactions, period);

    // Calculate growth rate (comparing last two periods)
    let revenueGrowth = 0;
    if (revenueByPeriod.length >= 2) {
      const lastPeriod = revenueByPeriod[revenueByPeriod.length - 1].revenue;
      const previousPeriod = revenueByPeriod[revenueByPeriod.length - 2].revenue;
      if (previousPeriod > 0) {
        revenueGrowth = ((lastPeriod - previousPeriod) / previousPeriod) * 100;
      }
    }

    // Project revenue for next period (simple linear projection)
    const projectedRevenue = calculateProjection(revenueByPeriod);

    // Period comparison (current vs previous)
    const periodComparison = calculatePeriodComparison(revenueByPeriod);

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      revenueByPeriod,
      revenueByPlatform,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      projectedRevenue: Math.round(projectedRevenue * 100) / 100,
      platformBreakdown: platformRevenue,
      periodComparison
    });
  } catch (error) {
    console.error('Failed to fetch revenue analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}

function groupByPeriod(transactions: any[], period: string) {
  const groups: Record<string, { date: string; revenue: number; transactions: number }> = {};

  transactions.forEach((t: any) => {
    let key: string;
    const date = new Date(t.date);

    if (period === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const week = getWeekNumber(date);
      key = `${date.getFullYear()}-W${week}`;
    } else if (period === 'monthly') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = date.toISOString().split('T')[0];
    }

    if (!groups[key]) {
      groups[key] = { date: key, revenue: 0, transactions: 0 };
    }

    groups[key].revenue += t.amount || 0;
    groups[key].transactions += 1;
  });

  return Object.values(groups)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(g => ({
      ...g,
      revenue: Math.round(g.revenue * 100) / 100
    }));
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function calculateProjection(periodData: any[]): number {
  if (periodData.length < 2) return 0;

  // Simple linear regression for projection
  const recentPeriods = periodData.slice(-5); // Use last 5 periods
  const sum = recentPeriods.reduce((acc, p) => acc + p.revenue, 0);
  const avg = sum / recentPeriods.length;

  // Calculate trend
  let trend = 0;
  if (recentPeriods.length >= 2) {
    const changes = [];
    for (let i = 1; i < recentPeriods.length; i++) {
      changes.push(recentPeriods[i].revenue - recentPeriods[i - 1].revenue);
    }
    trend = changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  return avg + trend;
}

function calculatePeriodComparison(periodData: any[]) {
  if (periodData.length < 2) return null;

  const currentPeriod = periodData[periodData.length - 1];
  const previousPeriod = periodData[periodData.length - 2];

  const revenueChange = currentPeriod.revenue - previousPeriod.revenue;
  const revenueChangePercent = previousPeriod.revenue > 0 
    ? (revenueChange / previousPeriod.revenue) * 100 
    : 0;

  const transactionChange = currentPeriod.transactions - previousPeriod.transactions;
  const transactionChangePercent = previousPeriod.transactions > 0
    ? (transactionChange / previousPeriod.transactions) * 100
    : 0;

  return {
    current: {
      revenue: Math.round(currentPeriod.revenue * 100) / 100,
      transactions: currentPeriod.transactions
    },
    previous: {
      revenue: Math.round(previousPeriod.revenue * 100) / 100,
      transactions: previousPeriod.transactions
    },
    change: {
      revenue: Math.round(revenueChange * 100) / 100,
      revenuePercent: Math.round(revenueChangePercent * 100) / 100,
      transactions: transactionChange,
      transactionPercent: Math.round(transactionChangePercent * 100) / 100
    }
  };
}
