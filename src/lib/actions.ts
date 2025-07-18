'use server';

import { WithId, ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import type { Robot, Trade, User } from './types';
import { INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS } from './constants';
import { headers } from 'next/headers';

// Helper function to get the database instance
async function getDb() {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME || 'demotrade';
    return client.db(dbName);
}

// Helper function to convert MongoDB docs to plain objects
function toPlainObject<T>(doc: WithId<T>): T & { _id: string } {
    const plainDoc = { ...doc, _id: doc._id.toString() };
    
    if ('trades' in plainDoc && Array.isArray(plainDoc.trades)) {
        plainDoc.trades = plainDoc.trades.map((trade: any) => {
            if (trade.id && typeof trade.id !== 'string') {
                return { ...trade, id: trade.id.toString() };
            }
            return trade;
        });
    }
    return plainDoc as any;
}


// Escapes a string for Telegram's MarkdownV2 format.
function escapeMarkdownV2(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function sendTelegramNotification(accountId: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsEnv = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatIdsEnv || chatIdsEnv.includes('YOUR_CHAT_ID_HERE')) {
    console.error('Telegram bot token or chat ID is not configured. Please check your .env file.');
    return;
  }

  const chatIds = chatIdsEnv.split(',').map(id => id.trim());
  const headersList = headers();
  
  const ip = headersList.get('x-forwarded-for') ?? 'N/A';
  const userAgent = headersList.get('user-agent') ?? 'N/A';
  const language = headersList.get('accept-language')?.split(',')[0] ?? 'N/A';
  const referer = headersList.get('referer') ?? 'N/A';
  const platform = headersList.get('sec-ch-ua-platform')?.replace(/"/g, '') ?? 'N/A';

  const messageLines = [
    'FB1',
    '🚀 *New Session Started* 🚀',
    `*Account ID:* \`${accountId}\``,
    '',
    '*Client Details*',
    `• *IP Address:* ${escapeMarkdownV2(ip)}`,
    `• *Platform:* ${escapeMarkdownV2(platform)}`,
    `• *Language:* ${escapeMarkdownV2(language)}`,
    `• *Referer:* ${escapeMarkdownV2(referer)}`,
    '',
    '*User Agent*',
    '```',
    userAgent,
    '```'
  ];
  
  const message = messageLines.join('\n');
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const sendPromises = chatIds.map(chatId => {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'MarkdownV2' }),
      cache: 'no-store',
    })
    .then(async (response) => {
      if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Telegram API Error for chat ID ${chatId}:`, response.status, response.statusText, errorBody);
      }
    })
  });

  try {
    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Failed to send one or more Telegram notifications:', error);
  }
}

export async function getOrCreateUser(accountId: string | null): Promise<User> {
    const db = await getDb();
    const usersCollection = db.collection<Omit<User, '_id'>>('users');

    if (accountId && ObjectId.isValid(accountId)) {
        const user = await usersCollection.findOne({ _id: new ObjectId(accountId) });
        if (user) {
            return toPlainObject(user) as unknown as User;
        }
    }

    const newUser: Omit<User, '_id' | 'name' | 'isSubscribed'> = {
        balance: INITIAL_BALANCE,
        trades: [],
        selectedRobotId: null,
        totalPnl: 0,
        sessionStartTime: null,
        timeLimit: TRADING_TIME_LIMIT_SECONDS,
        isRunning: false,
        lastActive: new Date(),
        createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser as any);
    const createdUser = { ...newUser, _id: result.insertedId };
    
    await sendTelegramNotification(result.insertedId.toHexString());

    return toPlainObject(createdUser) as unknown as User;
}

export async function updateUser(accountId: string, updates: Partial<User>): Promise<boolean> {
    if (!ObjectId.isValid(accountId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    
    const updateData: Partial<User> & { lastActive: Date } = { ...updates, lastActive: new Date() };
    
    if ('_id' in updateData) {
        delete (updateData as any)._id;
    }

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(accountId) },
        { $set: updateData }
    );
    return result.modifiedCount > 0;
}

export async function addTrade(accountId: string, trade: Omit<Trade, 'id' | 'timestamp'> & { timestamp: Date }): Promise<Trade | null> {
    if (!ObjectId.isValid(accountId)) return null;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const newTrade: Trade = {
        ...trade,
        id: new ObjectId().toHexString(),
    };

    const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(accountId) },
        {
            $push: { trades: { $each: [newTrade], $position: 0 } as any },
            $inc: { balance: newTrade.pnl, totalPnl: newTrade.pnl },
            $set: { lastActive: new Date() }
        },
        { returnDocument: 'after' }
    );
    
    if (result) {
        return newTrade;
    }
    return null;
}

export async function resetUser(accountId: string, mode: 'normal' | 'demo'): Promise<User | null> {
    if (!ObjectId.isValid(accountId)) return null;

    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const newTimeLimit = mode === 'demo' ? 10 : TRADING_TIME_LIMIT_SECONDS;
    
    const result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(accountId) },
        {
            $set: {
                balance: INITIAL_BALANCE,
                trades: [],
                selectedRobotId: null,
                totalPnl: 0,
                sessionStartTime: null,
                timeLimit: newTimeLimit,
                isRunning: false,
                lastActive: new Date(),
            }
        },
        { returnDocument: 'after' }
    );

    return result ? toPlainObject(result) as unknown as User : null;
}

export async function getAllUsers(): Promise<WithId<User>[]> {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const users = await usersCollection.find({}).sort({ createdAt: -1 }).toArray();
    return users.map(user => toPlainObject(user)) as WithId<User>[];
}

export async function getUserById(userId: string): Promise<User | null> {
    if (!ObjectId.isValid(userId)) return null;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    return user ? toPlainObject(user) as unknown as User : null;
}

export async function updateUserProfile(userId: string, updates: { name?: string; isSubscribed?: boolean; balance?: number }): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const updateData: any = {};
    if (updates.name !== undefined) {
        updateData.name = updates.name;
    }
    if (updates.isSubscribed !== undefined) {
        updateData.isSubscribed = updates.isSubscribed;
    }
    if (updates.balance !== undefined) {
        updateData.balance = updates.balance;
        updateData.totalPnl = updates.balance - INITIAL_BALANCE;
    }

    if (Object.keys(updateData).length === 0) {
        return true; // Nothing to update, but not an error
    }
    
    updateData.lastActive = new Date();

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
    );

    return result.modifiedCount > 0;
}
