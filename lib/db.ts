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
  STORES: 'stores',
  TRANSACTIONS: 'transactions',
  UPLOADS: 'uploads',
};
