import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Import the recalculation function from the main transactions route
async function recalculateAnalytics() {
  const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
  const transactions = await transactionsCol.find({}).toArray();

  // Recalculate Sales
  const salesCol = await getCollection(COLLECTIONS.SALES);
  const totalSales = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  const orders = transactions.length;
  const avgOrderValue = orders > 0 ? totalSales / orders : 0;
  
  // Calculate week-over-week (simplified - comparing current week to previous)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  const currentWeekSales = transactions
    .filter(t => new Date(t.dateTime) >= oneWeekAgo)
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  
  const previousWeekSales = transactions
    .filter(t => new Date(t.dateTime) >= twoWeeksAgo && new Date(t.dateTime) < oneWeekAgo)
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  
  const weekOverWeek = previousWeekSales > 0 
    ? ((currentWeekSales - previousWeekSales) / previousWeekSales) * 100 
    : 0;

  await salesCol.updateOne(
    { key: 'summary' },
    { $set: { totalSales, orders, avgOrderValue, weekOverWeek } },
    { upsert: true }
  );

  // Recalculate Time Demand
  const hourlyData: any = {};
  const dailyData: any = {};
  
  transactions.forEach(t => {
    const date = new Date(t.dateTime);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (!hourlyData[hour]) hourlyData[hour] = { hour, sales: 0 };
    hourlyData[hour].sales += t.totalAmount || 0;
    
    if (!dailyData[day]) dailyData[day] = { day, sales: 0 };
    dailyData[day].sales += t.totalAmount || 0;
  });

  const hourlyCol = await getCollection(COLLECTIONS.TIME_DEMAND_HOURLY);
  const dailyCol = await getCollection(COLLECTIONS.TIME_DEMAND_DAILY);
  
  await hourlyCol.deleteMany({});
  await dailyCol.deleteMany({});
  
  if (Object.keys(hourlyData).length > 0) {
    await hourlyCol.insertMany(Object.values(hourlyData));
  }
  if (Object.keys(dailyData).length > 0) {
    await dailyCol.insertMany(Object.values(dailyData));
  }

  // Recalculate Sites
  const sitesData: any = {};
  transactions.forEach(t => {
    if (!sitesData[t.site]) {
      sitesData[t.site] = { name: t.site, revenue: 0, orders: 0, avgOrderValue: 0 };
    }
    sitesData[t.site].revenue += t.totalAmount || 0;
    sitesData[t.site].orders += 1;
  });

  Object.values(sitesData).forEach((site: any) => {
    site.avgOrderValue = site.orders > 0 ? site.revenue / site.orders : 0;
  });

  const sitesCol = await getCollection(COLLECTIONS.SITES);
  await sitesCol.deleteMany({});
  if (Object.keys(sitesData).length > 0) {
    await sitesCol.insertMany(Object.values(sitesData));
  }

  // Recalculate Products
  const productsData: any = {};
  transactions.forEach(t => {
    t.items.forEach((item: any) => {
      if (!productsData[item.productName]) {
        productsData[item.productName] = {
          name: item.productName,
          category: item.category,
          revenue: 0
        };
      }
      productsData[item.productName].revenue += (item.quantity * item.pricePerUnit);
    });
  });

  const productsCol = await getCollection(COLLECTIONS.PRODUCTS);
  await productsCol.deleteMany({});
  if (Object.keys(productsData).length > 0) {
    await productsCol.insertMany(Object.values(productsData));
  }

  // Recalculate Customers
  const newCustomers = transactions.filter(t => t.customerType === 'new').length;
  const returningCustomers = transactions.filter(t => t.customerType === 'returning').length;

  const customersCol = await getCollection(COLLECTIONS.CUSTOMERS);
  await customersCol.updateOne(
    { key: 'summary' },
    { $set: { new: newCustomers, returning: returningCustomers } },
    { upsert: true }
  );

  // Recalculate Spending (40% of sales as estimate)
  const spendData = Object.values(sitesData).map((site: any) => {
    const estimatedSpend = site.revenue * 0.4;
    return {
      site: site.name,
      week1: estimatedSpend,
      week2: estimatedSpend * 0.95,
      week3: estimatedSpend * 1.05,
      week4: estimatedSpend * 0.98
    };
  });

  const spendCol = await getCollection(COLLECTIONS.SPEND);
  await spendCol.deleteMany({});
  if (spendData.length > 0) {
    await spendCol.insertMany(spendData);
  }
}

// PUT - Update a transaction
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    const collection = await getCollection(COLLECTIONS.TRANSACTIONS);
    
    // Calculate total amount
    const totalAmount = updates.items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.pricePerUnit),
      0
    );

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          dateTime: new Date(updates.dateTime),
          site: updates.site,
          customerType: updates.customerType,
          items: updates.items,
          totalAmount
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Recalculate all analytics
    await recalculateAnalytics();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE - Delete a transaction
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await getCollection(COLLECTIONS.TRANSACTIONS);
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Recalculate all analytics
    await recalculateAnalytics();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
