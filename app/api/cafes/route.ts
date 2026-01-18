import { NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDatabase();
    const cafes = await db.collection(COLLECTIONS.CAFES).find({}).toArray();
    return NextResponse.json(cafes);
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, location } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Cafe name is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.CAFES);
    
    // Check if cafe already exists
    const existing = await collection.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: 'Cafe already exists' }, { status: 400 });
    }

    const result = await collection.insertOne({
      name: name.trim(),
      location: location?.trim() || '',
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      name: name.trim(),
      location: location?.trim() || ''
    });
  } catch (error) {
    console.error('Error creating cafe:', error);
    return NextResponse.json({ error: 'Failed to create cafe' }, { status: 500 });
  }
}
