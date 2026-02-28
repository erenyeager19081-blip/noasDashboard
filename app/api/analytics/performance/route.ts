import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        storePerformance: [],
        platformPerformance: [],
        topPerformers: [],
        underperformers: [],
        efficiencyMetrics: {},
        performanceScores: {},
        rankingChanges: []
      });
    }

    // Store performance analysis
    const storeStats = calculateStorePerformance(transactions);

    // Platform performance analysis
    const platformStats = calculatePlatformPerformance(transactions);

    // Identify top performers and underperformers
    const topPerformers = storeStats
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    const underperformers = storeStats
      .sort((a, b) => a.performanceScore - b.performanceScore)
      .slice(0, 3);

    // Calculate efficiency metrics
    const efficiencyMetrics = calculateEfficiencyMetrics(transactions, storeStats);

    // Overall performance scores
    const performanceScores = {
      overall: calculateOverallScore(storeStats),
      revenue: calculateRevenueScore(storeStats),
      consistency: calculateConsistencyScore(storeStats),
      growth: calculateGrowthScore(transactions)
    };

    return NextResponse.json({
      storePerformance: storeStats,
      platformPerformance: platformStats,
      topPerformers,
      underperformers,
      efficiencyMetrics,
      performanceScores,
      totalStores: storeStats.length,
      totalPlatforms: platformStats.length
    });
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

function calculateStorePerformance(transactions: any[]) {
  const storeData: Record<string, any> = {};

  // Group by store
  transactions.forEach((t: any) => {
    if (!storeData[t.storeName]) {
      storeData[t.storeName] = {
        storeName: t.storeName,
        platform: t.platform,
        revenue: 0,
        transactions: 0,
        avgTransactionValue: 0,
        dates: [],
        amounts: []
      };
    }

    storeData[t.storeName].revenue += t.amount || 0;
    storeData[t.storeName].transactions += 1;
    storeData[t.storeName].dates.push(new Date(t.date));
    storeData[t.storeName].amounts.push(t.amount || 0);
  });

  // Calculate metrics for each store
  const stores = Object.values(storeData).map((store: any) => {
    const avgTransactionValue = store.revenue / store.transactions;

    // Calculate revenue trend
    const sortedDates = store.dates.sort((a: Date, b: Date) => a.getTime() - b.getTime());
    const firstDate = sortedDates[0];
    const lastDate = sortedDates[sortedDates.length - 1];
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const revenuePerDay = daysDiff > 0 ? store.revenue / daysDiff : 0;

    // Calculate consistency (coefficient of variation)
    const mean = avgTransactionValue;
    const variance = store.amounts.reduce((sum: number, amt: number) => 
      sum + Math.pow(amt - mean, 2), 0) / store.amounts.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = mean > 0 ? Math.max(0, 100 - ((stdDev / mean) * 100)) : 0;

    // Performance score (weighted combination of metrics)
    const revenueWeight = 0.4;
    const transactionsWeight = 0.3;
    const consistencyWeight = 0.3;

    // Normalize values (using max values from all stores as baseline)
    const maxRevenue = Math.max(...Object.values(storeData).map((s: any) => s.revenue));
    const maxTransactions = Math.max(...Object.values(storeData).map((s: any) => s.transactions));

    const normalizedRevenue = maxRevenue > 0 ? (store.revenue / maxRevenue) * 100 : 0;
    const normalizedTransactions = maxTransactions > 0 ? (store.transactions / maxTransactions) * 100 : 0;

    const performanceScore = 
      (normalizedRevenue * revenueWeight) +
      (normalizedTransactions * transactionsWeight) +
      (consistencyScore * consistencyWeight);

    return {
      storeName: store.storeName,
      platform: store.platform,
      revenue: Math.round(store.revenue * 100) / 100,
      transactions: store.transactions,
      avgTransactionValue: Math.round(avgTransactionValue * 100) / 100,
      revenuePerDay: Math.round(revenuePerDay * 100) / 100,
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      performanceScore: Math.round(performanceScore * 100) / 100,
      rank: 0 // Will be assigned after sorting
    };
  });

  // Assign ranks
  stores.sort((a, b) => b.performanceScore - a.performanceScore);
  stores.forEach((store, index) => {
    store.rank = index + 1;
  });

  return stores;
}

function calculatePlatformPerformance(transactions: any[]) {
  const platformData: Record<string, any> = {};

  transactions.forEach((t: any) => {
    if (!platformData[t.platform]) {
      platformData[t.platform] = {
        platform: t.platform,
        revenue: 0,
        transactions: 0,
        stores: new Set()
      };
    }

    platformData[t.platform].revenue += t.amount || 0;
    platformData[t.platform].transactions += 1;
    platformData[t.platform].stores.add(t.storeName);
  });

  const totalRevenue = Object.values(platformData).reduce((sum: number, p: any) => sum + p.revenue, 0);

  return Object.values(platformData).map((platform: any) => ({
    platform: platform.platform,
    revenue: Math.round(platform.revenue * 100) / 100,
    transactions: platform.transactions,
    storeCount: platform.stores.size,
    avgTransactionValue: Math.round((platform.revenue / platform.transactions) * 100) / 100,
    revenueShare: Math.round((platform.revenue / totalRevenue) * 10000) / 100,
    avgRevenuePerStore: Math.round((platform.revenue / platform.stores.size) * 100) / 100
  }));
}

function calculateEfficiencyMetrics(transactions: any[], storeStats: any[]) {
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalTransactions = transactions.length;

  // Calculate date range
  const dates = transactions.map(t => new Date(t.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const daysCovered = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

  // Calculate metrics
  const avgRevenuePerDay = daysCovered > 0 ? totalRevenue / daysCovered : 0;
  const avgTransactionsPerDay = daysCovered > 0 ? totalTransactions / daysCovered : 0;
  const avgRevenuePerStore = storeStats.length > 0 ? totalRevenue / storeStats.length : 0;
  const avgTransactionsPerStore = storeStats.length > 0 ? totalTransactions / storeStats.length : 0;

  // Calculate peak day
  const dailyRevenue: Record<string, number> = {};
  transactions.forEach((t: any) => {
    const dateKey = new Date(t.date).toISOString().split('T')[0];
    dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + (t.amount || 0);
  });

  const peakDayRevenue = Math.max(...Object.values(dailyRevenue));
  const peakDay = Object.entries(dailyRevenue).find(([_, rev]) => rev === peakDayRevenue)?.[0];

  return {
    avgRevenuePerDay: Math.round(avgRevenuePerDay * 100) / 100,
    avgTransactionsPerDay: Math.round(avgTransactionsPerDay * 100) / 100,
    avgRevenuePerStore: Math.round(avgRevenuePerStore * 100) / 100,
    avgTransactionsPerStore: Math.round(avgTransactionsPerStore * 100) / 100,
    peakDay,
    peakDayRevenue: Math.round(peakDayRevenue * 100) / 100,
    daysCovered: Math.round(daysCovered),
    utilizationRate: Math.round((totalTransactions / (storeStats.length * daysCovered)) * 100) / 100
  };
}

function calculateOverallScore(storeStats: any[]) {
  if (storeStats.length === 0) return 0;
  const avgScore = storeStats.reduce((sum, s) => sum + s.performanceScore, 0) / storeStats.length;
  return Math.round(avgScore * 100) / 100;
}

function calculateRevenueScore(storeStats: any[]) {
  if (storeStats.length === 0) return 0;
  const totalRevenue = storeStats.reduce((sum, s) => sum + s.revenue, 0);
  const avgRevenue = totalRevenue / storeStats.length;
  
  // Score based on average revenue (normalized to 0-100)
  // Assuming £1000 per store is excellent
  const score = Math.min(100, (avgRevenue / 1000) * 100);
  return Math.round(score * 100) / 100;
}

function calculateConsistencyScore(storeStats: any[]) {
  if (storeStats.length === 0) return 0;
  const avgConsistency = storeStats.reduce((sum, s) => sum + s.consistencyScore, 0) / storeStats.length;
  return Math.round(avgConsistency * 100) / 100;
}

function calculateGrowthScore(transactions: any[]) {
  const sortedTransactions = transactions
    .map(t => ({ ...t, date: new Date(t.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sortedTransactions.length < 2) return 0;

  // Split into two halves
  const midpoint = Math.floor(sortedTransactions.length / 2);
  const firstHalf = sortedTransactions.slice(0, midpoint);
  const secondHalf = sortedTransactions.slice(midpoint);

  const firstHalfRevenue = firstHalf.reduce((sum, t) => sum + (t.amount || 0), 0);
  const secondHalfRevenue = secondHalf.reduce((sum, t) => sum + (t.amount || 0), 0);

  if (firstHalfRevenue === 0) return 0;

  const growthPercent = ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;

  // Convert to 0-100 score (0% growth = 50, >50% growth = 100, <-50% growth = 0)
  const score = Math.max(0, Math.min(100, 50 + growthPercent));
  return Math.round(score * 100) / 100;
}
