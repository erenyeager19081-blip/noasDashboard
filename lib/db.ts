import clientPromise from './mongodb';

export async function getDatabase() {
  const client = await clientPromise;
  return client.db('noas_dashboard');
}

export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  return db.collection(collectionName);
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  SALES: 'sales',
  TIME_DEMAND_HOURLY: 'time_demand_hourly',
  TIME_DEMAND_DAILY: 'time_demand_daily',
  SITES: 'sites',
  SPEND: 'spend',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  CAFES: 'cafes',
  PRODUCT_CATALOG: 'product_catalog',
};
