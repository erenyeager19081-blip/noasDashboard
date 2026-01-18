import { NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDatabase();
    const products = await db.collection(COLLECTIONS.PRODUCT_CATALOG).find({}).toArray();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, category, defaultPrice } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    if (!category || !['food', 'drink'].includes(category)) {
      return NextResponse.json({ error: 'Valid category (food/drink) is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const collection = db.collection(COLLECTIONS.PRODUCT_CATALOG);
    
    // Check if product already exists
    const existing = await collection.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json({ error: 'Product already exists' }, { status: 400 });
    }

    const result = await collection.insertOne({
      name: name.trim(),
      category,
      defaultPrice: defaultPrice ? parseFloat(defaultPrice) : 0,
      createdAt: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      id: result.insertedId,
      name: name.trim(),
      category,
      defaultPrice: defaultPrice ? parseFloat(defaultPrice) : 0
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
