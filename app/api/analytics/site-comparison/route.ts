import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        stores: [],
        totalSales: 0,
        totalOrders: 0,
        overallAOV: 0
      });
    }

    // Calculate week boundaries
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(currentWeekStart.getDate() - 7);

    const lastWeekEnd = new Date(currentWeekStart);

    // Group transactions by store
    const storeData: Record<string, any> = {};

    transactions.forEach(t => {
      const storeName = t.storeName;
      const date = new Date(t.date);
      const amount = t.amount || 0;

      if (!storeData[storeName]) {
        storeData[storeName] = {
          storeName,
          platform: t.platform,
          totalSales: 0,
          totalOrders: 0,
          currentWeekSales: 0,
          currentWeekOrders: 0,
          lastWeekSales: 0,
          lastWeekOrders: 0
        };
      }

      storeData[storeName].totalSales += amount;
      storeData[storeName].totalOrders += 1;

      // Current week
      if (date >= currentWeekStart && date <= now) {
        storeData[storeName].currentWeekSales += amount;
        storeData[storeName].currentWeekOrders += 1;
      }

      // Last week
      if (date >= lastWeekStart && date < lastWeekEnd) {
        storeData[storeName].lastWeekSales += amount;
        storeData[storeName].lastWeekOrders += 1;
      }
    });

    // Calculate derived metrics
    const stores = Object.values(storeData).map((store: any) => {
      const aov = store.totalOrders > 0 ? store.totalSales / store.totalOrders : 0;
      const weekOnWeekChange = store.lastWeekSales > 0
        ? ((store.currentWeekSales - store.lastWeekSales) / store.lastWeekSales) * 100
        : 0;

      return {
        ...store,
        aov,
        weekOnWeekChange,
        orderGrowth: store.lastWeekOrders > 0
          ? ((store.currentWeekOrders - store.lastWeekOrders) / store.lastWeekOrders) * 100
          : 0
      };
    });

    // Sort by total sales descending
    stores.sort((a, b) => b.totalSales - a.totalSales);

    // Calculate overall metrics
    const totalSales = stores.reduce((sum, s) => sum + s.totalSales, 0);
    const totalOrders = stores.reduce((sum, s) => sum + s.totalOrders, 0);
    const overallAOV = totalOrders > 0 ? totalSales / totalOrders : 0;

    return NextResponse.json({
      stores,
      totalSales,
      totalOrders,
      overallAOV,
      storeCount: stores.length
    });
  } catch (error) {
    console.error('Failed to fetch site comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site comparison' },
      { status: 500 }
    );
  }
}
