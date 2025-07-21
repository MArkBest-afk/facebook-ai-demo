// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise: Promise<MongoClient>

// Function to create TTL index
const createTtlIndex = async (client: MongoClient) => {
  try {
    const dbName = process.env.DB_NAME || 'demotrade';
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    const indexName = 'lastActive_ttl';
    const indexes = await usersCollection.listIndexes().toArray();
    const indexExists = indexes.some(index => index.name === indexName);

    if (!indexExists) {
      // Expire documents 10 days after the lastActive date
      await usersCollection.createIndex({ "lastActive": 1 }, { expireAfterSeconds: 864000, name: indexName });
      console.log('Successfully created TTL index on lastActive field.');
    }
  } catch (e) {
    console.error('Error creating TTL index:', e);
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