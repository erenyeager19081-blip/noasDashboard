import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST() {
  try {
    const db = await getDatabase();
    
    // List of collections to create
    const collections = ['users', 'stores', 'transactions', 'uploads'];
    
    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    
    const created = [];
    const skipped = [];
    
    for (const collectionName of collections) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        created.push(collectionName);
      } else {
        skipped.push(collectionName);
      }
    }
    
    // Create indexes for transactions collection
    if (created.includes('transactions') || existingNames.includes('transactions')) {
      const transactionsCol = db.collection('transactions');
      await transactionsCol.createIndex({ storeId: 1 });
      await transactionsCol.createIndex({ date: -1 });
      await transactionsCol.createIndex({ transactionId: 1 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      created,
      skipped,
      total: collections.length
    });
    
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({
      success: true,
      collections: collections.map(c => c.name)
    });
    
  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check database' },
      { status: 500 }
    );
  }
}
