import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS } from '@/lib/db';
import Papa from 'papaparse';

interface ParsedTransaction {
  storeId: string;
  storeName: string;
  platform: string;
  date: Date;
  hour: number;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  transactionId: string;
  amount: number;
  paymentMethod?: string;
  customerIdentifier?: string; // Anonymized - last 4 digits of card
  products?: {
    name: string;
    category: string;
    quantity: number;
    price: number;
  }[];
}

// Categorize products as Food or Drinks
function categorizeProduct(productName: string): string {
  if (!productName) return 'Other';
  
  const name = productName.toLowerCase();
  
  // Drinks keywords
  const drinkKeywords = ['coffee', 'tea', 'latte', 'cappuccino', 'espresso', 'mocha', 'americano', 
    'juice', 'smoothie', 'shake', 'water', 'soda', 'cola', 'drink', 'beverage', 'beer', 'wine',
    'hot chocolate', 'iced', 'frappe', 'milkshake'];
  
  // Food keywords
  const foodKeywords = ['sandwich', 'burger', 'pizza', 'salad', 'cake', 'pastry', 'muffin',
    'cookie', 'brownie', 'toast', 'bagel', 'croissant', 'panini', 'wrap', 'breakfast', 'lunch'];
  
  for (const keyword of drinkKeywords) {
    if (name.includes(keyword)) return 'Drinks';
  }
  
  for (const keyword of foodKeywords) {
    if (name.includes(keyword)) return 'Food';
  }
  
  return 'Other';
}

// Parse TakeMyPayments CSV with enhanced data extraction
function parseTakeMyPayments(csvText: string, storeName: string): ParsedTransaction[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const transactions: ParsedTransaction[] = [];

  result.data.forEach((row: any) => {
    try {
      // Parse date: DD/MM/YYYY HH:MM
      const dateParts = row['Date']?.split(' ');
      if (!dateParts || dateParts.length < 2) return;
      
      const [day, month, year] = dateParts[0].split('/');
      const [hour, minute] = dateParts[1].split(':');
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );

      // Parse amount - remove £ symbol and parse
      const amountStr = row['Sale Total']?.replace(/[£,]/g, '') || '0';
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || !date || isNaN(date.getTime())) return;

      // Extract customer identifier (last 4 of card for repeat tracking)
      const customerIdentifier = row['Card Last 4'] || row['Customer ID'] || null;

      // Extract products if available
      const products = [];
      if (row['Product Name'] || row['Item Name']) {
        const productName = row['Product Name'] || row['Item Name'];
        const category = categorizeProduct(productName);
        const quantity = parseInt(row['Quantity'] || '1');
        const price = parseFloat((row['Item Price'] || row['Price'] || amountStr).replace(/[£,]/g, ''));
        
        products.push({
          name: productName,
          category,
          quantity,
          price
        });
      }

      transactions.push({
        storeId: row['Device ID'] || storeName,
        storeName,
        platform: 'takemypayments',
        date,
        hour: parseInt(hour),
        dayOfWeek: date.getDay(),
        transactionId: row['id'] || row['Order Number'],
        amount,
        paymentMethod: row['Payment Method'],
        customerIdentifier,
        products: products.length > 0 ? products : undefined
      });
    } catch (error) {
      console.error('Error parsing TakeMyPayments row:', error);
    }
  });

  return transactions;
}

// Parse Booker CSV with enhanced data extraction
function parseBooker(csvText: string, storeName: string): ParsedTransaction[] {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const transactions: ParsedTransaction[] = [];

  result.data.forEach((row: any) => {
    try {
      // Parse date: DD/MM/YYYY
      const [day, month, year] = row['Date']?.split('/') || [];
      
      // Parse time: HH:MM
      const [hour, minute] = row['Time']?.split(':') || ['0', '0'];
      
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );

      // Parse amount - remove £ and � symbols and parse
      const amountStr = row['Invoice Total']?.replace(/[£�,]/g, '') || '0';
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || !date || isNaN(date.getTime())) return;

      // Extract customer identifier
      const customerIdentifier = row['Card Last 4'] || row['Customer ID'] || null;

      // Extract products if available
      const products = [];
      if (row['Product Name'] || row['Item Name'] || row['Description']) {
        const productName = row['Product Name'] || row['Item Name'] || row['Description'];
        const category = categorizeProduct(productName);
        const quantity = parseInt(row['Quantity'] || row['Qty'] || '1');
        const price = parseFloat((row['Item Price'] || row['Price'] || amountStr).replace(/[£�,]/g, ''));
        
        products.push({
          name: productName,
          category,
          quantity,
          price
        });
      }

      transactions.push({
        storeId: row['Invoice No']?.substring(0, 7) || storeName,
        storeName,
        platform: 'booker',
        date,
        hour: parseInt(hour),
        dayOfWeek: date.getDay(),
        transactionId: row['Invoice No'],
        amount,
        paymentMethod: 'card',
        customerIdentifier,
        products: products.length > 0 ? products : undefined
      });
    } catch (error) {
      console.error('Error parsing Booker row:', error);
    }
  });

  return transactions;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fileCount = parseInt(formData.get('fileCount') as string);
    
    const allTransactions: ParsedTransaction[] = [];
    const storeNames = new Set<string>();

    // Process each file
    for (let i = 0; i < fileCount; i++) {
      const file = formData.get(`file_${i}`) as File;
      const storeName = formData.get(`storeName_${i}`) as string;
      const platform = formData.get(`platform_${i}`) as string;

      if (!file) continue;

      // Read file content
      const text = await file.text();
      
      // Parse based on platform
      let transactions: ParsedTransaction[] = [];
      
      if (platform === 'takemypayments') {
        transactions = parseTakeMyPayments(text, storeName);
      } else if (platform === 'booker') {
        transactions = parseBooker(text, storeName);
      }

      allTransactions.push(...transactions);
      storeNames.add(storeName);
    }

    // Clear existing data
    const transactionsCol = await getCollection(COLLECTIONS.TRANSACTIONS);
    const storesCol = await getCollection(COLLECTIONS.STORES);
    const uploadsCol = await getCollection(COLLECTIONS.UPLOADS);

    await transactionsCol.deleteMany({});
    await storesCol.deleteMany({});

    // Store new transactions
    if (allTransactions.length > 0) {
      await transactionsCol.insertMany(allTransactions);
    }

    // Store store information
    const storeData = Array.from(storeNames).map((name, index) => ({
      storeId: `store_${index + 1}`,
      name,
      active: true
    }));
    
    if (storeData.length > 0) {
      await storesCol.insertMany(storeData);
    }

    // Record upload metadata
    await uploadsCol.insertOne({
      uploadedAt: new Date(),
      filesCount: fileCount,
      transactionsCount: allTransactions.length,
      storesCount: storeNames.size
    });

    return NextResponse.json({
      success: true,
      transactionsCount: allTransactions.length,
      storesCount: storeNames.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process files' },
      { status: 500 }
    );
  }
}
