import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDatabase();
    const uploadsCollection = db.collection('uploads');

    // Get upload metadata from uploads collection
    const stores = await uploadsCollection.find({}).toArray();

    // Transform to match expected format
    const storesData = stores.map(store => ({
      storeId: store.storeId,
      storeName: store.storeName,
      platform: store.platform,
      transactionCount: store.transactionCount || 0,
      lastUploaded: store.lastUploaded
    }));

    return NextResponse.json({ success: true, stores: storesData });

  } catch (error) {
    console.error('Status fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
