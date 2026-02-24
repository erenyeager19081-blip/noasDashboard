import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        hourlyData: [],
        dailyData: [],
        peakHour: 0,
        peakDay: 0
      });
    }

    // Hourly analysis (0-23)
    const hourlyStats: Record<number, { hour: number; sales: number; transactions: number }> = {};
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = { hour: i, sales: 0, transactions: 0 };
    }

    // Daily analysis (0=Sunday, 6=Saturday)
    const dailyStats: Record<number, { day: number; sales: number; transactions: number }> = {};
    for (let i = 0; i < 7; i++) {
      dailyStats[i] = { day: i, sales: 0, transactions: 0 };
    }

    // Process transactions
    transactions.forEach((t: any) => {
      const date = new Date(t.date);
      const hour = date.getHours();
      const day = date.getDay();

      hourlyStats[hour].sales += t.amount || 0;
      hourlyStats[hour].transactions += 1;

      dailyStats[day].sales += t.amount || 0;
      dailyStats[day].transactions += 1;
    });

    const hourlyData = Object.values(hourlyStats);
    const dailyData = Object.values(dailyStats);

    // Find peak hour
    const peakHour = hourlyData.reduce((max, curr) => 
      curr.sales > max.sales ? curr : max
    );

    // Find peak day
    const peakDay = dailyData.reduce((max, curr) => 
      curr.sales > max.sales ? curr : max
    );

    return NextResponse.json({
      hourlyData,
      dailyData,
      peakHour: peakHour.hour,
      peakDay: peakDay.day
    });
  } catch (error) {
    console.error('Failed to fetch time analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time analysis' },
      { status: 500 }
    );
  }
}
