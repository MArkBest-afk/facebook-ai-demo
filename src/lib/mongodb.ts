// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise: Promise<MongoClient>

// Function to create TTL index for automatic cleanup
const createTtlIndex = async (client: MongoClient) => {
  try {
    const dbName = process.env.DB_NAME || 'demotrade';
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    const indexName = 'inactive_users_ttl';
    const oldIndexName = 'lastActive_ttl';
    const indexes = await usersCollection.listIndexes().toArray();
    
    const indexExists = indexes.some(index => index.name === indexName);
    const oldIndexExists = indexes.some(index => index.name === oldIndexName);

    // Drop the old index if it exists
    if (oldIndexExists) {
      await usersCollection.dropIndex(oldIndexName);
      console.log('Successfully dropped old TTL index.');
    }

    if (!indexExists) {
      // Expire documents 12 hours after the lastActive date, but only if they meet specific criteria
      await usersCollection.createIndex(
        { "lastActive": 1 }, 
        { 
          expireAfterSeconds: 43200, // 12 hours
          name: indexName,
          partialFilterExpression: {
            isSubscribed: { $ne: true },
            name: { $exists: false },
            selectedRobotId: { $eq: null },
            chatMessages: { $size: 0 }
          }
        }
      );
      console.log('Successfully created partial TTL index for inactive users.');
    }
  } catch (e) {
    console.error('Error managing TTL index:', e);
  }
};


if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect().then(client => {
      createTtlIndex(client);
      return client;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect().then(client => {
    createTtlIndex(client);
    return client;
  });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
