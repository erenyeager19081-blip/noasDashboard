import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

// GET all transactions
export async function GET() {
  try {
    const collection = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await collection.find({}).sort({ dateTime: -1 }).toArray();
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// POST new transaction and auto-update all analytics
export async function POST(request: Request) {
  try {
    const transaction = await request.json();
    
    // Add timestamps
    transaction.createdAt = new Date();
    
    // Calculate total amount
    transaction.totalAmount = transaction.items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.pricePerUnit),
      0
    );
    
    // Save transaction
    const transactionsCollection = await getCollection(COLLECTIONS.TRANSACTIONS);
    const result = await transactionsCollection.insertOne(transaction);
    
    // Trigger analytics recalculation
    await recalculateAnalytics();
    
    return NextResponse.json({ 
      success: true, 
      transactionId: result.insertedId,
      message: 'Transaction saved and analytics updated'
    });
  } catch (error) {
    console.error('Failed to save transaction:', error);
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
  }
}

// Recalculate all analytics from transactions
async function recalculateAnalytics() {
  const transactionsCollection = await getCollection(COLLECTIONS.TRANSACTIONS);
  const transactions = await transactionsCollection.find({}).toArray();
  
  if (transactions.length === 0) return;

  // 1. Update Sales Performance
  await updateSalesPerformance(transactions);
  
  // 2. Update Time Demand (Hourly & Daily)
  await updateTimeDemand(transactions);
  
  // 3. Update Sites Comparison
  await updateSites(transactions);
  
  // 4. Update Products Performance
  await updateProducts(transactions);
  
  // 5. Update Customer Behavior
  await updateCustomers(transactions);
  
  // 6. Update Spending (estimated)
  await updateSpending(transactions);
}

async function updateSalesPerformance(transactions: any[]) {
  const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  const totalOrders = transactions.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Calculate WoW change (compare last 7 days vs previous 7 days)
  const now = new Date();
  const last7Days = transactions.filter(t => {
    const date = new Date(t.dateTime);
    const daysAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 7;
  });
  
  const previous7Days = transactions.filter(t => {
    const date = new Date(t.dateTime);
    const daysAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo > 7 && daysAgo <= 14;
  });
  
  const lastWeekSales = last7Days.reduce((sum, t) => sum + t.totalAmount, 0);
  const prevWeekSales = previous7Days.reduce((sum, t) => sum + t.totalAmount, 0);
  const weekOverWeek = prevWeekSales > 0 ? ((lastWeekSales - prevWeekSales) / prevWeekSales) * 100 : 0;
  
  const salesCollection = await getCollection(COLLECTIONS.SALES);
  await salesCollection.updateOne(
    { key: 'summary' },
    { 
      $set: { 
        key: 'summary',
        totalSales: Math.round(totalSales * 100) / 100,
        orders: totalOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        weekOverWeek: Math.round(weekOverWeek * 10) / 10
      } 
    },
    { upsert: true }
  );
}

async function updateTimeDemand(transactions: any[]) {
  // Hourly aggregation
  const hourlyData: { [key: number]: number } = {};
  for (let i = 0; i < 24; i++) hourlyData[i] = 0;
  
  transactions.forEach(t => {
    const hour = new Date(t.dateTime).getHours();
    hourlyData[hour] += t.totalAmount;
  });
  
  const hourlyCollection = await getCollection(COLLECTIONS.TIME_DEMAND_HOURLY);
  await hourlyCollection.deleteMany({});
  
  for (let hour = 0; hour < 24; hour++) {
    await hourlyCollection.insertOne({
      hour,
      sales: Math.round(hourlyData[hour] * 100) / 100
    });
  }
  
  // Daily aggregation
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyData: { [key: string]: number } = {};
  dayNames.forEach(day => dailyData[day] = 0);
  
  transactions.forEach(t => {
    const dayIndex = new Date(t.dateTime).getDay();
    dailyData[dayNames[dayIndex]] += t.totalAmount;
  });
  
  const dailyCollection = await getCollection(COLLECTIONS.TIME_DEMAND_DAILY);
  await dailyCollection.deleteMany({});
  
  for (const day of dayNames) {
    await dailyCollection.insertOne({
      day,
      sales: Math.round(dailyData[day] * 100) / 100
    });
  }
}

async function updateSites(transactions: any[]) {
  const sitesData: { [key: string]: { revenue: number; orders: number } } = {};
  
  transactions.forEach(t => {
    if (!sitesData[t.site]) {
      sitesData[t.site] = { revenue: 0, orders: 0 };
    }
    sitesData[t.site].revenue += t.totalAmount;
    sitesData[t.site].orders += 1;
  });
  
  const sitesCollection = await getCollection(COLLECTIONS.SITES);
  await sitesCollection.deleteMany({});
  
  for (const [siteName, data] of Object.entries(sitesData)) {
    await sitesCollection.insertOne({
      name: siteName,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
      avgOrderValue: Math.round((data.revenue / data.orders) * 100) / 100
    });
  }
}

async function updateProducts(transactions: any[]) {
  const productsData: { [key: string]: { revenue: number; category: string } } = {};
  
  transactions.forEach(t => {
    t.items.forEach((item: any) => {
      if (!productsData[item.productName]) {
        productsData[item.productName] = { revenue: 0, category: item.category };
      }
      productsData[item.productName].revenue += item.quantity * item.pricePerUnit;
    });
  });
  
  const productsCollection = await getCollection(COLLECTIONS.PRODUCTS);
  await productsCollection.deleteMany({});
  
  for (const [productName, data] of Object.entries(productsData)) {
    await productsCollection.insertOne({
      name: productName,
      revenue: Math.round(data.revenue * 100) / 100,
      category: data.category
    });
  }
}

async function updateCustomers(transactions: any[]) {
  let newCustomers = 0;
  let returningCustomers = 0;
  
  transactions.forEach(t => {
    if (t.customerType === 'new') {
      newCustomers += 1;
    } else if (t.customerType === 'returning') {
      returningCustomers += 1;
    }
  });
  
  const customersCollection = await getCollection(COLLECTIONS.CUSTOMERS);
  await customersCollection.updateOne(
    { key: 'summary' },
    { 
      $set: { 
        key: 'summary',
        new: newCustomers,
        returning: returningCustomers
      } 
    },
    { upsert: true }
  );
}

async function updateSpending(transactions: any[]) {
  // Group by site and calculate weekly spend (estimated at 40% of sales)
  const sitesSpend: { [key: string]: number[] } = {};
  
  // Get last 4 weeks of data
  const now = new Date();
  for (let week = 0; week < 4; week++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (week * 7 + 7));
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (week * 7));
    
    const weekTransactions = transactions.filter(t => {
      const date = new Date(t.dateTime);
      return date >= weekStart && date < weekEnd;
    });
    
    const siteWeekSpend: { [key: string]: number } = {};
    weekTransactions.forEach(t => {
      if (!siteWeekSpend[t.site]) siteWeekSpend[t.site] = 0;
      siteWeekSpend[t.site] += t.totalAmount * 0.4; // 40% cost estimate
    });
    
    Object.keys(siteWeekSpend).forEach(site => {
      if (!sitesSpend[site]) sitesSpend[site] = [0, 0, 0, 0];
      sitesSpend[site][3 - week] = Math.round(siteWeekSpend[site] * 100) / 100;
    });
  }
  
  const spendCollection = await getCollection(COLLECTIONS.SPEND);
  await spendCollection.deleteMany({});
  
  for (const [site, weeks] of Object.entries(sitesSpend)) {
    await spendCollection.insertOne({
      site,
      week1: weeks[0] || 0,
      week2: weeks[1] || 0,
      week3: weeks[2] || 0,
      week4: weeks[3] || 0
    });
  }
}
