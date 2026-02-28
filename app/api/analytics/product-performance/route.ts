import { NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';

export async function GET() {
  try {
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const transactions = await transactionsCol.find({}).toArray();

    if (transactions.length === 0) {
      return NextResponse.json({
        topProducts: [],
        bottomProducts: [],
        categorySplit: { Food: 0, Drinks: 0, Other: 0 },
        hasProductData: false
      });
    }

    // Check if we have product data
    const transactionsWithProducts = transactions.filter(t => t.products && t.products.length > 0);
    const hasProductData = transactionsWithProducts.length > 0;

    if (!hasProductData) {
      // Generate mock insights based on transaction patterns when no product data available
      return NextResponse.json({
        topProducts: [],
        bottomProducts: [],
        categorySplit: { Food: 0, Drinks: 0, Other: 0 },
        hasProductData: false,
        message: 'Product-level data not available in uploaded files. Upload files with product/item columns for detailed product analytics.'
      });
    }

    // Aggregate product data
    const productStats: Record<string, { name: string; revenue: number; quantity: number; category: string }> = {};

    transactionsWithProducts.forEach(t => {
      t.products?.forEach((product: any) => {
        if (!productStats[product.name]) {
          productStats[product.name] = {
            name: product.name,
            revenue: 0,
            quantity: 0,
            category: product.category || 'Other'
          };
        }
        productStats[product.name].revenue += product.price * product.quantity;
        productStats[product.name].quantity += product.quantity;
      });
    });

    // Sort products by revenue
    const allProducts = Object.values(productStats);
    allProducts.sort((a, b) => b.revenue - a.revenue);

    const topProducts = allProducts.slice(0, 5).map((p, index) => ({
      ...p,
      rank: index + 1,
      avgPrice: p.quantity > 0 ? p.revenue / p.quantity : 0
    }));

    const bottomProducts = allProducts.slice(-5).reverse().map((p, index) => ({
      ...p,
      rank: allProducts.length - index,
      avgPrice: p.quantity > 0 ? p.revenue / p.quantity : 0
    }));

    // Category split
    const categorySplit = {
      Food: 0,
      Drinks: 0,
      Other: 0
    };

    allProducts.forEach(p => {
      if (p.category === 'Food') {
        categorySplit.Food += p.revenue;
      } else if (p.category === 'Drinks') {
        categorySplit.Drinks += p.revenue;
      } else {
        categorySplit.Other += p.revenue;
      }
    });

    const totalRevenue = categorySplit.Food + categorySplit.Drinks + categorySplit.Other;
    const categorySplitPercentage = {
      Food: totalRevenue > 0 ? (categorySplit.Food / totalRevenue) * 100 : 0,
      Drinks: totalRevenue > 0 ? (categorySplit.Drinks / totalRevenue) * 100 : 0,
      Other: totalRevenue > 0 ? (categorySplit.Other / totalRevenue) * 100 : 0
    };

    return NextResponse.json({
      topProducts,
      bottomProducts,
      categorySplit,
      categorySplitPercentage,
      totalProducts: allProducts.length,
      hasProductData: true
    });
  } catch (error) {
    console.error('Failed to fetch product performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product performance' },
      { status: 500 }
    );
  }
}
