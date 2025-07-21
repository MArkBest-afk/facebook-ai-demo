// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise: Promise<MongoClient>

// Function to create TTL indexes for automatic cleanup
const createTtlIndexes = async (client: MongoClient) => {
  try {
    const dbName = process.env.DB_NAME || 'demotrade';
    const db = client.db(dbName);
    const usersCollection = db.collection('users');
    
    const indexes = await usersCollection.listIndexes().toArray();

    // Index 1: For inactive users (as configured before)
    const inactiveUsersIndexName = 'inactive_users_ttl';
    const oldInactiveIndexName = 'lastActive_ttl';
    const inactiveIndexExists = indexes.some(index => index.name === inactiveUsersIndexName);
    const oldInactiveIndexExists = indexes.some(index => index.name === oldInactiveIndexName);

    if (oldInactiveIndexExists) {
      await usersCollection.dropIndex(oldInactiveIndexName);
      console.log('Successfully dropped old TTL index for inactive users.');
    }

    if (!inactiveIndexExists) {
      await usersCollection.createIndex(
        { "lastActive": 1 }, 
        { 
          expireAfterSeconds: 43200, // 12 hours
          name: inactiveUsersIndexName,
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

    // Index 2: For localhost development sessions
    const localhostIndexName = 'localhost_sessions_ttl';
    const localhostIndexExists = indexes.some(index => index.name === localhostIndexName);

    if (!localhostIndexExists) {
        await usersCollection.createIndex(
            { "createdAt": 1 },
            {
                expireAfterSeconds: 18000, // 5 hours
                name: localhostIndexName,
                partialFilterExpression: {
                    ipAddress: 'localhost'
                }
            }
        );
        console.log('Successfully created TTL index for localhost sessions.');
    }

  } catch (e) {
    console.error('Error managing TTL indexes:', e);
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
      createTtlIndexes(client);
      return client;
    });
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect().then(client => {
    createTtlIndexes(client);
    return client;
  });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
