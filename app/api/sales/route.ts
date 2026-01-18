import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const collection = await getCollection(COLLECTIONS.SALES);
    const data = await collection.findOne({ key: 'summary' });
    
    return NextResponse.json(data || {
      totalSales: 0,
      orders: 0,
      avgOrderValue: 0,
      weekOverWeek: 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const collection = await getCollection(COLLECTIONS.SALES);
    
    await collection.updateOne(
      { key: 'summary' },
      { $set: { ...data, key: 'summary', updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save sales data' }, { status: 500 });
  }
}
