import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import * as XLSX from 'xlsx';

interface Transaction {
  transactionId: string;
  date: Date;
  amount: number;
  cardType: string;
  cardScheme: string;
  description: string;
  status: string;
  productType: string;
  storeName: string;
  storeId: string;
  platform: 'takemypayments' | 'booker';
  outletId?: string;
  mid?: string;
  bookerId?: number;
}

// Helper function to find column name (case-insensitive, with alternatives)
function findColumn(row: any, possibleNames: string[]): any {
  for (const name of possibleNames) {
    // Try exact match first
    if (row[name] !== undefined) return row[name];
    
    // Try case-insensitive match
    const keys = Object.keys(row);
    const found = keys.find(k => k.toLowerCase() === name.toLowerCase());
    if (found && row[found] !== undefined) return row[found];
  }
  return undefined;
}

// Parse TakeMyPayments CSV
function parseTakeMyPayments(data: any[], storeId: string, storeName: string, outletId?: string, mid?: string): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Debug: log first row to see column names
  if (data.length > 0) {
    console.log('TakeMyPayments CSV columns:', Object.keys(data[0]));
    console.log('Sample row:', JSON.stringify(data[0]));
  }

  for (const row of data) {
    const transactionId = findColumn(row, [
      'Invoice No', 'Invoice Number', 'InvoiceNo', 'Invoice_No', 'Invoice',
      'Transaction ID', 'TransactionID', 'Transaction_ID',
      'ID', 'Reference', 'Ref', 'Order ID', 'OrderID', 'Receipt No', 'Receipt Number'
    ]);
    
    const amount = findColumn(row, [
      'Total', 'Grand Total', 'GrandTotal', 'Grand_Total',
      'Amount', 'Total Amount', 'TotalAmount',
      'Value', 'Price', 'Net', 'Gross', 'Revenue',
      '20% Goods Ex Vat', '5% Goods Ex Vat', 'Goods Ex Vat',
      'Total Ex VAT', 'Total Inc VAT', 'Total Incl VAT'
    ]);
    
    if (!transactionId || !amount) {
      if (data.indexOf(row) < 3) {
        console.log(`Row ${data.indexOf(row)}: transactionId=${transactionId}, amount=${amount}`);
      }
      continue;
    }

    const productType = categorizeProduct(
      findColumn(row, ['Narrative', 'Description', 'Product', 'Service', 'Item']) || ''
    );
    
    // Parse amount - handle currency symbols
    let amountValue = 0;
    const amountStr = String(amount).replace(/[£$€,\s]/g, '');
    amountValue = parseFloat(amountStr) || 0;
    
    transactions.push({
      transactionId: String(transactionId).trim(),
      date: parseDate(findColumn(row, [
        'Date', 'Transaction Date', 'TransactionDate', 'Transaction_Date',
        'Created', 'Created Date', 'CreatedDate', 'Payment Date', 'PaymentDate',
        'Invoice Date', 'InvoiceDate', 'Sale Date', 'SaleDate'
      ])),
      amount: amountValue,
      cardType: String(findColumn(row, [
        'Card Type', 'CardType', 'Card_Type',
        'Payment Type', 'PaymentType', 'Payment_Type',
        'Type', 'Method'
      ]) || '').trim(),
      cardScheme: String(findColumn(row, [
        'Card Scheme', 'CardScheme', 'Card_Scheme',
        'Scheme', 'Brand', 'Card Brand', 'CardBrand'
      ]) || '').trim(),
      description: String(findColumn(row, [
        'Narrative', 'Description', 'Product', 'Item', 'Service'
      ]) || '').trim(),
      status: String(findColumn(row, [
        'Status', 'State', 'Transaction Status', 'Payment Status'
      ]) || 'Completed').trim(),
      productType,
      storeName,
      storeId,
      platform: 'takemypayments',
      outletId,
      mid
    });
  }
  
  console.log(`TakeMyPayments parse complete: ${transactions.length} transactions from ${data.length} rows`);

  return transactions;
}

// Parse Booker CSV
function parseBooker(data: any[], storeId: string, storeName: string, bookerId?: number): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Debug: log first row to see column names
  if (data.length > 0) {
    console.log('Booker CSV columns:', Object.keys(data[0]));
    console.log('Sample row:', JSON.stringify(data[0]));
  }

  for (const row of data) {
    const confirmationId = findColumn(row, [
      'Invoice No', 'Invoice Number', 'InvoiceNo', 'Invoice_No', 'Invoice',
      'Confirmation ID', 'ConfirmationID', 'Confirmation_ID', 'Confirmation Number',
      'Appointment ID', 'AppointmentID', 'Appointment_ID', 'Appointment Number',
      'Booking ID', 'BookingID', 'Booking_ID', 'Booking Number',
      'Reference', 'Reference ID', 'ReferenceID', 'Ref', 'Receipt No', 'Receipt Number',
      'ID', 'Order ID', 'OrderID', 'Order Number'
    ]);
    
    const serviceTotal = findColumn(row, [
      'Total', 'Grand Total', 'GrandTotal', 'Grand_Total',
      'Total Amount', 'TotalAmount', 'Total_Amount',
      'Net Total', 'NetTotal', 'Net_Total', 'Net Amount', 'NetAmount', 'Net',
      'Service Total', 'ServiceTotal', 'Service_Total',
      'Amount', 'Sale Amount', 'SaleAmount',
      'Price', 'Subtotal', 'SubTotal', 'Sub-Total',
      'Gross', 'Gross Amount', 'GrossAmount', 'Gross Total', 'GrossTotal',
      'Revenue', 'Sales', 'Value',
      // Try columns with VAT
      '20% Goods Ex Vat', '5% Goods Ex Vat', 'Goods Ex Vat',
      'Total Ex VAT', 'Total Inc VAT', 'Total Incl VAT'
    ]);
    
    if (!confirmationId || !serviceTotal) {
      // Debug log
      if (data.indexOf(row) < 3) {
        console.log(`Row ${data.indexOf(row)}: confirmationId=${confirmationId}, serviceTotal=${serviceTotal}`);
      }
      continue;
    }

    const productType = categorizeProduct(
      findColumn(row, [
        'Treatment', 'Service', 'Service Name', 'ServiceName',
        'Description', 'Product', 'Item', 'Category', 'Type'
      ]) || ''
    );
    
    // Parse amount - handle currency symbols
    let amount = 0;
    const amountStr = String(serviceTotal).replace(/[£$€,\s]/g, '');
    amount = parseFloat(amountStr) || 0;
    
    transactions.push({
      transactionId: String(confirmationId).trim(),
      date: parseDate(findColumn(row, [
        'Date', 'Transaction Date', 'TransactionDate', 'Transaction_Date',
        'Appointment Date', 'AppointmentDate', 'Appointment_Date',
        'Created', 'Created Date', 'CreatedDate',
        'Start Date', 'StartDate', 'Start_Date',
        'Booking Date', 'BookingDate', 'Service Date', 'ServiceDate',
        'Invoice Date', 'InvoiceDate', 'Sale Date', 'SaleDate'
      ])),
      amount,
      cardType: String(findColumn(row, [
        'Payment Method', 'PaymentMethod', 'Payment_Method',
        'Payment Type', 'PaymentType', 'Payment_Type',
        'Method', 'Card Type', 'CardType', 'Type'
      ]) || 'Card').trim(),
      cardScheme: 'N/A',
      description: String(findColumn(row, [
        'Treatment', 'Service', 'Service Name', 'ServiceName',
        'Description', 'Item', 'Product', 'Details'
      ]) || 'Service').trim(),
      status: String(findColumn(row, [
        'Status', 'Appointment Status', 'AppointmentStatus',
        'State', 'Booking Status', 'BookingStatus', 'Payment Status'
      ]) || 'Completed').trim(),
      productType,
      storeName,
      storeId,
      platform: 'booker',
      bookerId
    });
  }
  
  console.log(`Booker parse complete: ${transactions.length} transactions from ${data.length} rows`);

  return transactions;
}

// Product categorization
function categorizeProduct(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('haircut') || desc.includes('hair cut') || desc.includes('trim')) return 'Haircut';
  if (desc.includes('color') || desc.includes('colour') || desc.includes('dye') || desc.includes('highlight')) return 'Hair Color';
  if (desc.includes('style') || desc.includes('styling') || desc.includes('blow dry') || desc.includes('blowdry')) return 'Styling';
  if (desc.includes('perm') || desc.includes('straighten') || desc.includes('keratin')) return 'Treatment';
  if (desc.includes('facial') || desc.includes('face')) return 'Facial';
  if (desc.includes('massage')) return 'Massage';
  if (desc.includes('nail') || desc.includes('manicure') || desc.includes('pedicure')) return 'Nail Care';
  if (desc.includes('wax') || desc.includes('threading')) return 'Hair Removal';
  if (desc.includes('makeup') || desc.includes('make up')) return 'Makeup';
  if (desc.includes('extension') || desc.includes('wig')) return 'Extensions';
  if (desc.includes('consultation') || desc.includes('consult')) return 'Consultation';
  if (desc.includes('product') || desc.includes('retail')) return 'Products';
  
  return 'Other Services';
}

// Date parsing
function parseDate(dateStr: any): Date {
  if (!dateStr) return new Date();
  
  // Handle Excel serial date numbers
  if (typeof dateStr === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateStr * 86400000);
    if (!isNaN(date.getTime())) return date;
  }
  
  const str = String(dateStr).trim();
  
  // Try direct parsing first (handles ISO dates and datetime strings)
  const directParse = new Date(str);
  if (!isNaN(directParse.getTime())) return directParse;
  
  // Try various date formats with explicit parsing (including time)
  const formats = [
    // DD/MM/YYYY HH:MM:SS or DD/MM/YYYY HH:MM
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/, fn: (m: RegExpMatchArray) => {
      const h = m[4] ? parseInt(m[4]) : 0;
      const min = m[5] ? parseInt(m[5]) : 0;
      const s = m[6] ? parseInt(m[6]) : 0;
      return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), h, min, s);
    }},
    // YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM
    { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/, fn: (m: RegExpMatchArray) => {
      const h = m[4] ? parseInt(m[4]) : 0;
      const min = m[5] ? parseInt(m[5]) : 0;
      const s = m[6] ? parseInt(m[6]) : 0;
      return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), h, min, s);
    }},
    // DD-MM-YYYY HH:MM:SS or DD-MM-YYYY HH:MM
    { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/, fn: (m: RegExpMatchArray) => {
      const h = m[4] ? parseInt(m[4]) : 0;
      const min = m[5] ? parseInt(m[5]) : 0;
      const s = m[6] ? parseInt(m[6]) : 0;
      return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]), h, min, s);
    }},
    // MM/DD/YYYY (US format)
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, fn: (m: RegExpMatchArray) => new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])) },
  ];

  for (const format of formats) {
    const match = str.match(format.regex);
    if (match) {
      const date = format.fn(match);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Fallback to current date if parsing fails
  console.warn('Could not parse date:', str);
  return new Date();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const storeId = formData.get('storeId') as string;
    const storeName = formData.get('storeName') as string;
    const platform = formData.get('platform') as 'takemypayments' | 'booker';
    const outletId = formData.get('outletId') as string | null;
    const mid = formData.get('mid') as string | null;
    const bookerId = formData.get('bookerId') ? parseInt(formData.get('bookerId') as string) : null;

    if (!file || !storeId || !storeName || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File is empty or invalid' },
        { status: 400 }
      );
    }

    // Parse based on platform
    let transactions: Transaction[];
    if (platform === 'takemypayments') {
      transactions = parseTakeMyPayments(data, storeId, storeName, outletId || undefined, mid || undefined);
    } else {
      transactions = parseBooker(data, storeId, storeName, bookerId || undefined);
    }

    if (transactions.length === 0) {
      // Log column names for debugging
      const columns = data.length > 0 ? Object.keys(data[0] as Record<string, any>).join(', ') : 'none';
      console.error('No valid transactions found. File columns:', columns);
      console.error('Sample row:', JSON.stringify(data[0]));
      
      const expectedColumns = platform === 'booker' 
        ? 'Booker expects: [Confirmation ID / Appointment ID / Booking ID] AND [Service Total / Total / Amount]'
        : 'TakeMyPayments expects: [Transaction ID / ID / Reference] AND [Amount / Total / Value]';
      
      return NextResponse.json(
        { 
          success: false, 
          error: `No valid transactions found. ${expectedColumns}. Found ${data.length} rows but none matched the expected format.`,
          foundColumns: columns,
          sampleRow: data.length > 0 ? data[0] : null
        },
        { status: 400 }
      );
    }

    // Save to database - DELETE old data for this store, INSERT new data
    const db = await getDatabase();
    const transactionsCollection = db.collection('transactions');
    const uploadsCollection = db.collection('uploads');

    // Delete existing transactions for this store
    await transactionsCollection.deleteMany({ storeId });

    // Insert new transactions
    await transactionsCollection.insertMany(transactions);

    // Store upload metadata
    const uploadTimestamp = new Date().toISOString();
    await uploadsCollection.updateOne(
      { storeId },
      {
        $set: {
          storeId,
          storeName,
          platform,
          lastUploaded: uploadTimestamp,
          transactionCount: transactions.length,
          updatedAt: uploadTimestamp
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      transactionCount: transactions.length,
      lastUploaded: uploadTimestamp
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
