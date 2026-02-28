import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        newCustomers: 0,
        returningCustomers: 0,
        repeatRate: 0,
        hasCustomerData: false
      });
    }

    // Check if we have customer identifier data
    const transactionsWithCustomers = transactions.filter(t => t.customerIdentifier);
    const hasCustomerData = transactionsWithCustomers.length > 0;

    if (!hasCustomerData) {
      return NextResponse.json({
        newCustomers: 0,
        returningCustomers: 0,
        repeatRate: 0,
        hasCustomerData: false,
        message: 'Customer data not available in uploaded files. Upload files with card/customer ID columns for customer behaviour analytics.'
      });
    }

    // Track customer purchase frequency
    const customerPurchases: Record<string, number> = {};

    transactionsWithCustomers.forEach(t => {
      const customerId = t.customerIdentifier;
      if (customerId) {
        customerPurchases[customerId] = (customerPurchases[customerId] || 0) + 1;
      }
    });

    // Count new vs returning customers
    const newCustomers = Object.values(customerPurchases).filter(count => count === 1).length;
    const returningCustomers = Object.values(customerPurchases).filter(count => count > 1).length;
    const totalCustomers = newCustomers + returningCustomers;
    const repeatRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Additional insights
    const purchaseFrequencies = Object.values(customerPurchases);
    const avgPurchasesPerCustomer = purchaseFrequencies.reduce((sum, count) => sum + count, 0) / purchaseFrequencies.length;
    const maxPurchases = Math.max(...purchaseFrequencies);

    // Segment customers by frequency
    const frequencySegments = {
      oneTime: purchaseFrequencies.filter(c => c === 1).length,
      twotoFive: purchaseFrequencies.filter(c => c >= 2 && c <= 5).length,
      sixToTen: purchaseFrequencies.filter(c => c >= 6 && c <= 10).length,
      moreThanTen: purchaseFrequencies.filter(c => c > 10).length
    };

    return NextResponse.json({
      newCustomers,
      returningCustomers,
      totalCustomers,
      repeatRate,
      avgPurchasesPerCustomer,
      maxPurchases,
      frequencySegments,
      hasCustomerData: true
    });
  } catch (error) {
    console.error('Failed to fetch customer behaviour:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer behaviour' },
      { status: 500 }
    );
  }
}
