import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const collection = await getCollection(COLLECTIONS.CUSTOMERS);
    const data = await collection.findOne({ key: 'summary' });
    
    return NextResponse.json(data || {
      new: 0,
      returning: 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const collection = await getCollection(COLLECTIONS.CUSTOMERS);
    
    await collection.updateOne(
      { key: 'summary' },
      { $set: { ...data, key: 'summary', updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save customer data' }, { status: 500 });
  }
}
