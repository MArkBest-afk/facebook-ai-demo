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
    
    // --- New TTL Index Rules ---

    const rules = [
      // 1. Unsubscribed, no name: delete after 12 hours of inactivity
      {
        name: 'unsubscribed_no_name_ttl',
        key: { lastActive: 1 },
        expireAfterSeconds: 43200, // 12 hours
        partialFilterExpression: {
          isSubscribed: { $ne: true },
          name: { $exists: false }
        }
      },
      // 2. Subscribed, with name: delete after 1 week from creation
      {
        name: 'subscribed_with_name_ttl',
        key: { createdAt: 1 },
        expireAfterSeconds: 604800, // 7 days
        partialFilterExpression: {
          isSubscribed: true,
          name: { $exists: true }
        }
      },
      // 3. Unsubscribed, with name: delete after 4 days from creation
      {
        name: 'unsubscribed_with_name_ttl',
        key: { createdAt: 1 },
        expireAfterSeconds: 345600, // 4 days
        partialFilterExpression: {
          isSubscribed: { $ne: true },
          name: { $exists: true }
        }
      },
      // 4. No trading started: delete after 4 days from creation
      {
        name: 'not_started_trading_ttl',
        key: { createdAt: 1 },
        expireAfterSeconds: 345600, // 4 days
        partialFilterExpression: {
          sessionStartTime: null
        }
      },
      // 5. Trading time finished: delete after 1 week
      // We check if remaining time (timeLimit - (now - sessionStartTime)) is <= 0
      // This is tricky for a static filter. A simpler proxy is to check if sessionStartTime is not null.
      // A more robust way requires a script, but for TTL index, we can assume if time is up, they become inactive.
      // Let's create an index that deletes users 1 week after their session *started*, if it's not null.
      {
        name: 'finished_session_ttl',
        key: { sessionStartTime: 1 },
        expireAfterSeconds: 604800, // 7 days
        partialFilterExpression: {
          sessionStartTime: { $ne: null }
        }
      },
       // 6. For localhost development sessions
      {
        name: 'localhost_sessions_ttl',
        key: { createdAt: 1 },
        expireAfterSeconds: 18000, // 5 hours
        partialFilterExpression: {
            ipAddress: 'localhost'
        }
      }
    ];

    const existingIndexes = await usersCollection.listIndexes().toArray();
    const existingIndexNames = existingIndexes.map(idx => idx.name);

    // Drop old indexes if they exist
    const oldIndexesToDrop = ['inactive_users_ttl', 'lastActive_ttl'];
    for (const oldIndexName of oldIndexesToDrop) {
      if (existingIndexNames.includes(oldIndexName)) {
        await usersCollection.dropIndex(oldIndexName);
        console.log(`Successfully dropped old TTL index: ${oldIndexName}`);
      }
    }

    // Create new indexes
    for (const rule of rules) {
      if (!existingIndexNames.includes(rule.name)) {
        await usersCollection.createIndex(rule.key, {
          name: rule.name,
          expireAfterSeconds: rule.expireAfterSeconds,
          partialFilterExpression: rule.partialFilterExpression,
        });
        console.log(`Successfully created TTL index: ${rule.name}`);
      }
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
