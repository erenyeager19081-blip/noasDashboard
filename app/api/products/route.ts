import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const collection = await getCollection(COLLECTIONS.PRODUCTS);
    const data = await collection.find({}).toArray();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const collection = await getCollection(COLLECTIONS.PRODUCTS);
    
    await collection.deleteMany({});
    if (data.length > 0) {
      await collection.insertMany(data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save products' }, { status: 500 });
  }
}
