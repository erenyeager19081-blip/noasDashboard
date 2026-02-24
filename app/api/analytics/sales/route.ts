import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        stores: [],
        topStores: [],
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0
      });
    }

    // Group by store
    const storeStats: Record<string, any> = {};

    transactions.forEach((t: any) => {
      if (!storeStats[t.storeName]) {
        storeStats[t.storeName] = {
          storeName: t.storeName,
          platform: t.platform,
          totalSales: 0,
          transactions: 0,
          avgTransaction: 0
        };
      }
      storeStats[t.storeName].totalSales += t.amount || 0;
      storeStats[t.storeName].transactions += 1;
    });

    // Calculate averages
    Object.values(storeStats).forEach((store: any) => {
      store.avgTransaction = store.totalSales / store.transactions;
    });

    // Sort by sales
    const stores = Object.values(storeStats).sort((a: any, b: any) => b.totalSales - a.totalSales);
    const topStores = stores.slice(0, 5);

    const totalSales = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalSales / totalTransactions;

    return NextResponse.json({
      stores,
      topStores,
      totalSales,
      totalTransactions,
      averageTransaction
    });
  } catch (error) {
    console.error('Failed to fetch sales data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    );
  }
}
