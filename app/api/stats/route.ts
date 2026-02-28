import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'monthly';
    
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const uploadsCol = await getCollection(COLLECTIONS.UPLOADS);
    
    // Get all transactions
    let allTransactions = await transactionsCol.find({}).toArray();
    
    // Filter by period
    const now = new Date();
    let transactions = allTransactions;
    
    if (period !== 'all') {
      transactions = allTransactions.filter((t: any) => {
        const transDate = new Date(t.date);
        const diffTime = now.getTime() - transDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        switch(period) {
          case 'daily':
            return diffDays <= 1;
          case 'weekly':
            return diffDays <= 7;
          case 'monthly':
            return diffDays <= 30;
          case 'yearly':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }
    
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
