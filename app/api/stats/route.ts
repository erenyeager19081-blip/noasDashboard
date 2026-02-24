import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const uploadsCol = await getCollection(COLLECTIONS.UPLOADS);
    
    // Get all transactions
    const transactions = await transactionsCol.find({}).toArray();
    
    // Calculate stats
    const totalSales = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalTransactions = transactions.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // Get unique stores
    const uniqueStores = new Set(transactions.map(t => t.storeId));
    const totalStores = uniqueStores.size;
    
    // Get last upload date
    const lastUpload = await uploadsCol.findOne({}, { sort: { uploadedAt: -1 } });
    
    return NextResponse.json({
      totalSales,
      totalTransactions,
      averageTransaction,
      totalStores,
      lastUploadDate: lastUpload?.uploadedAt || null
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({
      totalSales: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      totalStores: 0,
      lastUploadDate: null
    });
  }
}
