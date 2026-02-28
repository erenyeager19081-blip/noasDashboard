const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

console.log('Testing MongoDB Connection...');
console.log('URI:', uri ? uri.substring(0, 30) + '...' : 'NOT FOUND');

async function testConnection() {
  try {
    console.log('\n1. Creating MongoDB client...');
    const client = new MongoClient(uri);
    
    console.log('2. Attempting to connect...');
    await client.connect();
    
    console.log('3. ✅ Connected successfully!');
    
    console.log('4. Testing database access...');
    const db = client.db('noas_dashboard');
    const collections = await db.listCollections().toArray();
    
    console.log('5. ✅ Database accessible!');
    console.log('   Found collections:', collections.map(c => c.name).join(', ') || 'none (new database)');
    
    console.log('\n6. Testing ping...');
    await db.admin().ping();
    console.log('7. ✅ Ping successful!');
    
    await client.close();
    console.log('\n✅ All tests passed! MongoDB connection is working.');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error details:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Name:', error.name);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check Network Access in MongoDB Atlas (allow 0.0.0.0/0)');
      console.error('  2. Verify your cluster is running (not paused)');
      console.error('  3. Check if your IP is whitelisted');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Verify username and password are correct');
      console.error('  2. Check Database Access in MongoDB Atlas');
    } else if (error.message.includes('EBADNAME')) {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Connection string format is incorrect');
      console.error('  2. Check cluster hostname');
    }
    
    process.exit(1);
  }
}

testConnection();
