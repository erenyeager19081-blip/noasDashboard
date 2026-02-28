import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        dailyTrends: [],
        weeklyTrends: [],
        monthlyTrends: [],
        trendDirection: 'neutral',
        trendVelocity: 0,
        movingAverages: [],
        seasonalPatterns: {},
        bestPerformingDay: null,
        worstPerformingDay: null,
        consistencyScore: 0
      });
    }

    // Sort transactions by date
    const sortedTransactions = transactions
      .map((t: any) => ({ ...t, date: new Date(t.date) }))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

    // Daily trends
    const dailyTrends = calculateDailyTrends(sortedTransactions);

    // Weekly trends
    const weeklyTrends = calculateWeeklyTrends(sortedTransactions);

    // Monthly trends
    const monthlyTrends = calculateMonthlyTrends(sortedTransactions);

    // Calculate trend direction and velocity
    const { direction, velocity } = calculateTrendDirection(dailyTrends);

    // Calculate moving averages (7-day and 30-day)
    const movingAverages = calculateMovingAverages(dailyTrends);

    // Seasonal patterns (by day of week and month)
    const seasonalPatterns = calculateSeasonalPatterns(sortedTransactions);

    // Best and worst performing days
    const bestPerformingDay = dailyTrends.length > 0 
      ? dailyTrends.reduce((max, curr) => curr.revenue > max.revenue ? curr : max)
      : null;

    const worstPerformingDay = dailyTrends.length > 0
      ? dailyTrends.reduce((min, curr) => curr.revenue < min.revenue ? curr : min)
      : null;

    // Consistency score (coefficient of variation - lower is more consistent)
    const consistencyScore = calculateConsistencyScore(dailyTrends);

    return NextResponse.json({
      dailyTrends,
      weeklyTrends,
      monthlyTrends,
      trendDirection: direction,
      trendVelocity: Math.round(velocity * 100) / 100,
      movingAverages,
      seasonalPatterns,
      bestPerformingDay,
      worstPerformingDay,
      consistencyScore: Math.round(consistencyScore * 100) / 100
    });
  } catch (error) {
    console.error('Failed to fetch trends analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends analytics' },
      { status: 500 }
    );
  }
}

function calculateDailyTrends(transactions: any[]) {
  const dailyData: Record<string, { date: string; revenue: number; transactions: number; avgValue: number }> = {};

  transactions.forEach((t: any) => {
    const dateKey = new Date(t.date).toISOString().split('T')[0];

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { date: dateKey, revenue: 0, transactions: 0, avgValue: 0 };
    }

    dailyData[dateKey].revenue += t.amount || 0;
    dailyData[dateKey].transactions += 1;
  });

  return Object.values(dailyData)
    .map(d => ({
      ...d,
      revenue: Math.round(d.revenue * 100) / 100,
      avgValue: Math.round((d.revenue / d.transactions) * 100) / 100
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateWeeklyTrends(transactions: any[]) {
  const weeklyData: Record<string, { week: string; revenue: number; transactions: number; avgValue: number }> = {};

  transactions.forEach((t: any) => {
    const date = new Date(t.date);
    const week = getWeekNumber(date);
    const weekKey = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { week: weekKey, revenue: 0, transactions: 0, avgValue: 0 };
    }

    weeklyData[weekKey].revenue += t.amount || 0;
    weeklyData[weekKey].transactions += 1;
  });

  return Object.values(weeklyData)
    .map(w => ({
      ...w,
      revenue: Math.round(w.revenue * 100) / 100,
      avgValue: Math.round((w.revenue / w.transactions) * 100) / 100
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

function calculateMonthlyTrends(transactions: any[]) {
  const monthlyData: Record<string, { month: string; revenue: number; transactions: number; avgValue: number }> = {};

  transactions.forEach((t: any) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, revenue: 0, transactions: 0, avgValue: 0 };
    }

    monthlyData[monthKey].revenue += t.amount || 0;
    monthlyData[monthKey].transactions += 1;
  });

  return Object.values(monthlyData)
    .map(m => ({
      ...m,
      revenue: Math.round(m.revenue * 100) / 100,
      avgValue: Math.round((m.revenue / m.transactions) * 100) / 100
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function calculateTrendDirection(dailyData: any[]) {
  if (dailyData.length < 2) {
    return { direction: 'neutral', velocity: 0 };
  }

  // Calculate linear regression slope
  const n = dailyData.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = dailyData.map(d => d.revenue);

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // Determine direction
  let direction: 'up' | 'down' | 'neutral';
  if (slope > 5) {
    direction = 'up';
  } else if (slope < -5) {
    direction = 'down';
  } else {
    direction = 'neutral';
  }

  return { direction, velocity: slope };
}

function calculateMovingAverages(dailyData: any[]) {
  if (dailyData.length === 0) return [];

  const movingAverages: any[] = [];

  dailyData.forEach((day, index) => {
    // 7-day moving average
    const start7 = Math.max(0, index - 6);
    const window7 = dailyData.slice(start7, index + 1);
    const avg7 = window7.reduce((sum, d) => sum + d.revenue, 0) / window7.length;

    // 30-day moving average
    const start30 = Math.max(0, index - 29);
    const window30 = dailyData.slice(start30, index + 1);
    const avg30 = window30.reduce((sum, d) => sum + d.revenue, 0) / window30.length;

    movingAverages.push({
      date: day.date,
      actual: day.revenue,
      ma7: Math.round(avg7 * 100) / 100,
      ma30: Math.round(avg30 * 100) / 100
    });
  });

  return movingAverages;
}

function calculateSeasonalPatterns(transactions: any[]) {
  // By day of week
  const dayOfWeekData: Record<number, { revenue: number; transactions: number }> = {};
  for (let i = 0; i < 7; i++) {
    dayOfWeekData[i] = { revenue: 0, transactions: 0 };
  }

  // By month
  const monthData: Record<number, { revenue: number; transactions: number }> = {};
  for (let i = 1; i <= 12; i++) {
    monthData[i] = { revenue: 0, transactions: 0 };
  }

  transactions.forEach((t: any) => {
    const date = new Date(t.date);
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;

    dayOfWeekData[dayOfWeek].revenue += t.amount || 0;
    dayOfWeekData[dayOfWeek].transactions += 1;

    monthData[month].revenue += t.amount || 0;
    monthData[month].transactions += 1;
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    byDayOfWeek: Object.entries(dayOfWeekData).map(([day, data]) => ({
      day: dayNames[parseInt(day)],
      dayNumber: parseInt(day),
      revenue: Math.round(data.revenue * 100) / 100,
      transactions: data.transactions,
      avgValue: data.transactions > 0 ? Math.round((data.revenue / data.transactions) * 100) / 100 : 0
    })),
    byMonth: Object.entries(monthData)
      .filter(([_, data]) => data.transactions > 0)
      .map(([month, data]) => ({
        month: monthNames[parseInt(month) - 1],
        monthNumber: parseInt(month),
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.transactions,
        avgValue: Math.round((data.revenue / data.transactions) * 100) / 100
      }))
  };
}

function calculateConsistencyScore(dailyData: any[]) {
  if (dailyData.length < 2) return 0;

  const revenues = dailyData.map(d => d.revenue);
  const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;

  // Calculate standard deviation
  const squaredDiffs = revenues.map(r => Math.pow(r - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / revenues.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (as percentage)
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Convert to 0-100 score (lower CV = higher consistency score)
  return Math.max(0, 100 - cv);
}
