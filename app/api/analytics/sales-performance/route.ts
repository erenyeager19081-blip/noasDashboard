import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly';

    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        totalSales: 0,
        ordersCount: 0,
        aov: 0,
        periodChange: 0,
        currentPeriodSales: 0,
        lastPeriodSales: 0,
        currentPeriodOrders: 0,
        lastPeriodOrders: 0,
        breakdown: [],
        periodLabel: getPeriodLabel(period),
        currentPeriodLabel: getCurrentPeriodLabel(period),
        lastPeriodLabel: getLastPeriodLabel(period)
      });
    }

    const now = new Date();
    let currentPeriodStart: Date;
    let lastPeriodStart: Date;
    let lastPeriodEnd: Date;
    let breakdownData: any[] = [];
    
    // Calculate boundaries based on period
    switch (period) {
      case 'daily':
        // Today vs Yesterday
        currentPeriodStart = new Date(now);
        currentPeriodStart.setHours(0, 0, 0, 0);
        
        lastPeriodStart = new Date(currentPeriodStart);
        lastPeriodStart.setDate(currentPeriodStart.getDate() - 1);
        
        lastPeriodEnd = new Date(currentPeriodStart);
        
        // Daily breakdown for last 30 days
        for (let i = 29; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(now.getDate() - i);
          day.setHours(0, 0, 0, 0);
          breakdownData.push({
            date: day.toISOString(),
            label: day.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            start: day,
            end: new Date(day.getTime() + 24 * 60 * 60 * 1000)
          });
        }
        break;
        
      case 'weekly':
        // Current week vs Last week
        currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(now.getDate() - now.getDay());
        currentPeriodStart.setHours(0, 0, 0, 0);
        
        lastPeriodStart = new Date(currentPeriodStart);
        lastPeriodStart.setDate(currentPeriodStart.getDate() - 7);
        
        lastPeriodEnd = new Date(currentPeriodStart);
        
        // Weekly breakdown for last 12 weeks
        for (let i = 11; i >= 0; i--) {
          const weekStart = new Date(currentPeriodStart);
          weekStart.setDate(currentPeriodStart.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          
          breakdownData.push({
            date: weekStart.toISOString(),
            label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            start: weekStart,
            end: weekEnd
          });
        }
        break;
        
      case 'monthly':
        // Current month vs Last month
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        lastPeriodEnd = new Date(currentPeriodStart);
        
        // Monthly breakdown for last 12 months
        for (let i = 11; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
          
          breakdownData.push({
            date: month.toISOString(),
            label: month.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
            start: month,
            end: monthEnd
          });
        }
        break;
        
      case 'yearly':
        // Current year vs Last year
        currentPeriodStart = new Date(now.getFullYear(), 0, 1);
        
        lastPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        lastPeriodEnd = new Date(currentPeriodStart);
        
        // Monthly breakdown for last 24 months (2 years)
        for (let i = 23; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
          
          breakdownData.push({
            date: month.toISOString(),
            label: month.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
            start: month,
            end: monthEnd
          });
        }
        break;
        
      case 'all':
        // All time - split into years
        const allDates = transactions.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
        
        currentPeriodStart = new Date(0); // Beginning of time
        lastPeriodStart = new Date(0);
        lastPeriodEnd = new Date(0);
        
        // Yearly breakdown
        const startYear = minDate.getFullYear();
        const endYear = maxDate.getFullYear();
        for (let year = startYear; year <= endYear; year++) {
          breakdownData.push({
            date: new Date(year, 0, 1).toISOString(),
            label: year.toString(),
            start: new Date(year, 0, 1),
            end: new Date(year, 11, 31, 23, 59, 59)
          });
        }
        break;
        
      default:
        currentPeriodStart = new Date(now);
        currentPeriodStart.setDate(now.getDate() - now.getDay());
        currentPeriodStart.setHours(0, 0, 0, 0);
        
        lastPeriodStart = new Date(currentPeriodStart);
        lastPeriodStart.setDate(currentPeriodStart.getDate() - 7);
        
        lastPeriodEnd = new Date(currentPeriodStart);
    }

    // Overall metrics
    const totalSales = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const ordersCount = transactions.length;
    const aov = totalSales / ordersCount;

    // Current period transactions
    const currentPeriodTransactions = period === 'all' 
      ? transactions 
      : transactions.filter(t => {
          const date = new Date(t.date);
          return date >= currentPeriodStart && date <= now;
        });

    // Last period transactions
    const lastPeriodTransactions = period === 'all'
      ? []
      : transactions.filter(t => {
          const date = new Date(t.date);
          return date >= lastPeriodStart && date < lastPeriodEnd;
        });

    const currentPeriodSales = currentPeriodTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const lastPeriodSales = lastPeriodTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate period-on-period percentage change
    const periodChange = lastPeriodSales > 0 
      ? ((currentPeriodSales - lastPeriodSales) / lastPeriodSales) * 100 
      : 0;

    // Calculate breakdown data
    const breakdown = breakdownData.map(item => {
      const itemTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= item.start && tDate < item.end;
      });

      const itemSales = itemTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      return {
        date: item.date,
        label: item.label,
        sales: itemSales,
        orders: itemTransactions.length
      };
    });

    return NextResponse.json({
      totalSales,
      ordersCount,
      aov,
      periodChange,
      currentPeriodSales,
      lastPeriodSales,
      currentPeriodOrders: currentPeriodTransactions.length,
      lastPeriodOrders: lastPeriodTransactions.length,
      breakdown,
      periodLabel: getPeriodLabel(period),
      currentPeriodLabel: getCurrentPeriodLabel(period),
      lastPeriodLabel: getLastPeriodLabel(period)
    });
  } catch (error) {
    console.error('Failed to fetch sales performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales performance' },
      { status: 500 }
    );
  }
}

function getPeriodLabel(period: string): string {
  switch (period) {
    case 'daily': return 'Day-on-Day';
    case 'weekly': return 'Week-on-Week';
    case 'monthly': return 'Month-on-Month';
    case 'yearly': return 'Year-on-Year';
    case 'all': return 'All Time';
    default: return 'Week-on-Week';
  }
}

function getCurrentPeriodLabel(period: string): string {
  switch (period) {
    case 'daily': return 'Today';
    case 'weekly': return 'Current Week';
    case 'monthly': return 'Current Month';
    case 'yearly': return 'Current Year';
    case 'all': return 'All Time';
    default: return 'Current Week';
  }
}

function getLastPeriodLabel(period: string): string {
  switch (period) {
    case 'daily': return 'Yesterday';
    case 'weekly': return 'Last Week';
    case 'monthly': return 'Last Month';
    case 'yearly': return 'Last Year';
    case 'all': return 'N/A';
    default: return 'Last Week';
  }
}
