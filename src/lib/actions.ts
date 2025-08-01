
'use server';

import { type WithId, ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import type { Robot, Trade, User, Notification, ChatMessage, Manager } from './types';
import { INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS, TRADING_SYMBOLS } from './constants';
import { headers } from 'next/headers';
import { assistChat } from '@/ai/flows/chat-assistant';
import bcrypt from 'bcryptjs';


// Helper function to get the database instance
async function getDb() {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME || 'demotrade';
    return client.db(dbName);
}

// Helper function to convert MongoDB docs to plain objects
function toPlainObject<T extends { _id: ObjectId }>(doc: WithId<T>): T {
    const plainDoc = { ...doc, _id: doc._id.toString() };
    
    if ('trades' in plainDoc && Array.isArray(plainDoc.trades)) {
        plainDoc.trades = plainDoc.trades.map((trade: any) => {
            if (trade.id && typeof trade.id !== 'string') {
                return { ...trade, id: trade.id.toString() };
            }
            return trade;
        });
    }

    if ('notifications' in plainDoc && Array.isArray(plainDoc.notifications)) {
        plainDoc.notifications = plainDoc.notifications.map((notification: any) => {
            if (notification.id && typeof notification.id !== 'string') {
                return { ...notification, id: notification.id.toString() };
            }
            return notification;
        });
    }
    
    if ('chatMessages' in plainDoc && Array.isArray(plainDoc.chatMessages)) {
        plainDoc.chatMessages = plainDoc.chatMessages.map((msg: any) => {
            if (msg.id && typeof msg.id !== 'string') {
                return { ...msg, id: msg.id.toString() };
            }
            return msg;
        });
    }
    return plainDoc as any;
}


// Escapes a string for Telegram's MarkdownV2 format.
function escapeMarkdownV2(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

export async function sendTelegramNotification(accountId: string, leadName?: string | null) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsEnv = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatIdsEnv || chatIdsEnv.includes('YOUR_CHAT_ID_HERE')) {
    console.error('Telegram bot token or chat ID is not configured. Please check your .env file.');
    return;
  }

  const chatIds = chatIdsEnv.split(',').map(id => id.trim());
  const headersList = headers();
  
  const forwardedFor = headersList.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'N/A';
  const userAgent = headersList.get('user-agent') ?? 'N/A';
  const language = headersList.get('accept-language')?.split(',')[0] ?? 'N/A';
  const referer = headersList.get('referer') ?? 'N/A';
  const platform = headersList.get('sec-ch-ua-platform')?.replace(/"/g, '') ?? 'N/A';

  const messageLines = [
    leadName ? '👨‍💻 *New Lead* 👨‍💻' : '🚀 *New Session Started* 🚀',
    `*Account ID:* \`${accountId}\``,
    ...(leadName ? [`*Lead Name:* ${escapeMarkdownV2(leadName)}`] : []),
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

async function getGeoLocation(ip: string | null): Promise<{ ipAddress?: string; location?: string }> {
    if (!ip || ip === '::1' || ip.startsWith('127.0.0.1')) {
        return { ipAddress: 'localhost', location: 'N/A' };
    }
    const clientIp = ip.split(',')[0].trim();
    try {
        const response = await fetch(`http://ip-api.com/json/${clientIp}`, { cache: 'no-store' });
        if (!response.ok) {
            return { ipAddress: clientIp, location: 'N/A' };
        }
        const data = await response.json();
        if (data.status === 'success') {
            const location = [data.city, data.country].filter(Boolean).join(', ');
            return { ipAddress: clientIp, location: location || 'N/A' };
        }
        return { ipAddress: clientIp, location: 'N/A' };
    } catch (error) {
        console.error("Geolocation fetch error:", error);
        return { ipAddress: clientIp, location: 'N/A' };
    }
}

export async function getOrCreateUser(accountId: string | null, leadSignature: string | null): Promise<User> {
    const db = await getDb();
    const usersCollection = db.collection<Omit<User, '_id'>>('users');
    
    // If a lead signature is provided, try to find the user by name first
    if (leadSignature) {
        const existingUser = await usersCollection.findOne({ name: leadSignature });
        if (existingUser) {
            await usersCollection.updateOne({ _id: existingUser._id }, { $set: { lastActive: new Date() } });
            return toPlainObject(existingUser) as unknown as User;
        }
    }

    if (accountId && ObjectId.isValid(accountId)) {
        const user = await usersCollection.findOne({ _id: new ObjectId(accountId) });
        if (user) {
            await usersCollection.updateOne({ _id: new ObjectId(accountId) }, { $set: { lastActive: new Date() } });
            return toPlainObject(user) as unknown as User;
        }
    }

    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null;
    const geoLocation = await getGeoLocation(ip);

    const newUser: Omit<User, '_id' | 'duplicates'> = {
        name: leadSignature || undefined,
        balance: INITIAL_BALANCE,
        trades: [],
        selectedRobotId: null,
        totalPnl: 0,
        sessionStartTime: null,
        timeLimit: TRADING_TIME_LIMIT_SECONDS,
        isRunning: false,
        isBlocked: false,
        isSubscribed: !!leadSignature,
        lastActive: new Date(),
        createdAt: new Date(),
        ipAddress: geoLocation.ipAddress,
        location: geoLocation.location,
        comment: '',
        notifications: [],
        chatMessages: [],
        isAiChatEnabled: true,
        hasUnreadAdminMessages: false,
        isHotLead: false,
    };

    const result = await usersCollection.insertOne(newUser as any);
    const createdUser = { ...newUser, _id: result.insertedId };
    
    await sendTelegramNotification(result.insertedId.toHexString(), leadSignature);

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
        id: new ObjectId(),
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
        return { ...newTrade, id: newTrade.id.toString() };
    }
    return null;
}

export async function addManualTrade(accountId: string, tradeType: 'profitable' | 'losing'): Promise<boolean> {
    if (!ObjectId.isValid(accountId)) return false;

    let pnl = Math.random() * (2 - 1) + 1;
    
    if (tradeType === 'losing') {
        pnl = -pnl;
    }

    const tradeAmount = 50; 
    const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
    const entryPrice = Math.random() * 100 + 100;
    const quantity = tradeAmount / entryPrice;
    const exitPrice = entryPrice + (pnl / quantity);
    
    const tradeData = {
        symbol,
        type: pnl > 0 ? 'BUY' : 'SELL',
        quantity: parseFloat(quantity.toFixed(4)),
        entryPrice: parseFloat(entryPrice.toFixed(2)),
        exitPrice: parseFloat(exitPrice.toFixed(2)),
        pnl: parseFloat(pnl.toFixed(2)),
        timestamp: new Date(),
    };

    const createdTrade = await addTrade(accountId, tradeData);
    return !!createdTrade;
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
                notifications: [],
                chatMessages: [],
                isHotLead: false,
                firstName: undefined,
                lastName: undefined,
                phone: undefined,
                email: undefined,
            }
        },
        { returnDocument: 'after' }
    );

    return result ? toPlainObject(result) as unknown as User : null;
}

export async function getAllUsers(page: number = 1, limit: number = 30, searchQuery: string = '', managerId?: string): Promise<{ users: WithId<User>[], total: number }> {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const skip = (page - 1) * limit;

    const query: any = {};

    if (managerId) {
        query.name = managerId;
    }

    if (searchQuery) {
        const trimmedQuery = searchQuery.trim();
        const orConditions = [
            { name: { $regex: trimmedQuery, $options: 'i' } },
            // Search by part of the ObjectId string
            { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: trimmedQuery, options: "i" } } }
        ];

        // If manager is searching, the OR condition must be within their own leads
        if (query.name) {
            query.$and = [
                { name: query.name },
                { $or: orConditions }
            ];
            delete query.name; // Avoid redundant name check
        } else {
            query.$or = orConditions;
        }
    }

    const total = await usersCollection.countDocuments(query);
    const users = await usersCollection.find(query)
        .sort({ isHotLead: -1, hasUnreadAdminMessages: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    return {
        users: users.map(user => toPlainObject(user)) as WithId<User>[],
        total,
    };
}


export async function getUserById(userId: string): Promise<User | null> {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    let user;
    if (ObjectId.isValid(userId)) {
        user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    } else {
        // Fallback for lead_sig which might not be an ObjectId
        user = await usersCollection.findOne({ name: userId });
    }
    
    return user ? toPlainObject(user) as unknown as User : null;
}

export async function getUsersByName(name: string): Promise<User[]> {
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const users = await usersCollection.find({ name }).sort({ createdAt: -1 }).toArray();
    return users.map(user => toPlainObject(user)) as User[];
}


export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    const userBeforeUpdate = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!userBeforeUpdate) return false;

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.isBlocked !== undefined) updateData.isBlocked = updates.isBlocked;
    if (updates.selectedRobotId !== undefined) updateData.selectedRobotId = updates.selectedRobotId;
    if (updates.comment !== undefined) updateData.comment = updates.comment;
    if (updates.isAiChatEnabled !== undefined) updateData.isAiChatEnabled = updates.isAiChatEnabled;

    if (updates.balance !== undefined) {
        const newBalance = updates.balance;
        updateData.balance = newBalance;
        updateData.totalPnl = newBalance - INITIAL_BALANCE;
    }

    if (updates.isRunning !== undefined) {
        updateData.isRunning = updates.isRunning;
        if (updates.isRunning && !userBeforeUpdate.sessionStartTime) {
            updateData.sessionStartTime = Date.now();
        }
    }
    
    if (Object.keys(updateData).length === 0) {
        return true; 
    }
    
    updateData.lastActive = new Date();

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
    );

    return result.modifiedCount > 0;
}


export async function deleteUser(userId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    
    const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

    return result.deletedCount > 0;
}

export async function updateUserSubscription(userId: string, isSubscribed: boolean): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');
    
    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isSubscribed: isSubscribed, lastActive: new Date() } }
    );

    return result.modifiedCount > 0;
}


export async function sendNotificationToUser(userId: string, message: string): Promise<boolean> {
    if (!ObjectId.isValid(userId) || !message) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const newNotification: Notification = {
        id: new ObjectId(),
        message,
        timestamp: new Date(),
        read: false,
    };

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { notifications: newNotification as any } }
    );

    return result.modifiedCount > 0;
}

export async function markNotificationsAsRead(userId: string, notificationIds: (string | ObjectId)[]): Promise<boolean> {
    if (!ObjectId.isValid(userId) || notificationIds.length === 0) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const objectIdNotificationIds = notificationIds.map(id => new ObjectId(id.toString()));

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { "notifications.$[elem].read": true } },
        { arrayFilters: [{ "elem.id": { $in: objectIdNotificationIds } }] }
    );

    return result.modifiedCount > 0;
}


export async function sendChatMessage(userId: string, message: Partial<Omit<ChatMessage, 'id' | 'timestamp'>>): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const newChatMessage: Omit<ChatMessage, 'id'> = {
        sender: message.sender || 'user',
        senderName: message.senderName,
        text: message.text || '',
        timestamp: new Date(),
        read: message.sender === 'admin',
        readByAdmin: message.sender === 'admin',
        paymentInfo: message.paymentInfo,
        paymentLink: message.paymentLink,
    };
    
    const dbChatMessage = { ...newChatMessage, id: new ObjectId() };

    const updateQuery: any = {
        $push: { chatMessages: dbChatMessage as any },
        $set: { lastActive: new Date() }
    };
    
    if (newChatMessage.sender === 'user') {
        updateQuery.$set.hasUnreadAdminMessages = true;
    }

    const updateResult = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        updateQuery
    );

    if (updateResult.modifiedCount > 0 && newChatMessage.sender === 'user') {
        const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
        
        if (updatedUser && updatedUser.isAiChatEnabled && !updatedUser.isHotLead) {
            try {
                const chatHistory = updatedUser.chatMessages || [];
                if (chatHistory.length > 0) {
                     const serializableChatHistory = JSON.stringify(chatHistory.map(msg => ({
                         sender: msg.sender,
                         text: msg.text,
                         senderName: msg.senderName
                     })));

                     const aiResponse = await assistChat({ userId, chatHistory: serializableChatHistory });

                    if (aiResponse && aiResponse.answer) {
                        await sendChatMessage(userId, { sender: 'admin', text: aiResponse.answer, senderName: 'Поддержка' });
                    }
                }
            } catch (error) {
                console.error('Error triggering AI chat response:', error);
            }
        }
    }

    return updateResult.modifiedCount > 0;
}

export async function markChatMessagesAsRead(userId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { "chatMessages.$[elem].read": true } },
        { arrayFilters: [{ "elem.sender": "admin" }] }
    );

    return result.modifiedCount > 0;
}

export async function markAdminChatMessagesAsRead(userId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                hasUnreadAdminMessages: false,
                "chatMessages.$[elem].readByAdmin": true
            }
        },
        { arrayFilters: [{ "elem.sender": "user" }] }
    );

    return result.modifiedCount > 0;
}


export async function deleteChatMessage(userId: string, messageId: string | ObjectId): Promise<boolean> {
    if (!ObjectId.isValid(userId) || !ObjectId.isValid(messageId.toString())) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { chatMessages: { id: new ObjectId(messageId.toString()) } } as any }
    );

    return result.modifiedCount > 0;
}

export async function clearChatHistory(userId: string): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { chatMessages: [], hasUnreadAdminMessages: false } }
    );

    return result.modifiedCount > 0;
}

export async function saveLeadDetails(
    userId: string, 
    firstName: string, 
    lastName: string, 
    phone: string, 
    email: string
): Promise<{success: boolean}> {
    if (!ObjectId.isValid(userId)) {
        return { success: false };
    }
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
            $set: {
                firstName,
                lastName,
                phone,
                email,
                isHotLead: true,
                hasUnreadAdminMessages: true, 
                lastActive: new Date()
            }
        }
    );

    return { success: result.modifiedCount > 0 };
}

export async function extendSessionTime(userId: string, additionalTimeInSeconds: number): Promise<boolean> {
    if (!ObjectId.isValid(userId)) return false;
    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { 
            $inc: { timeLimit: additionalTimeInSeconds },
            $set: { lastActive: new Date() }
        }
    );

    // Also send a notification to the user
    if (result.modifiedCount > 0) {
        const hours = Math.floor(additionalTimeInSeconds / 3600);
        const minutes = Math.floor((additionalTimeInSeconds % 3600) / 60);
        
        let timeString = '';
        if (hours > 0) timeString += `${hours} час(а/ов) `;
        if (minutes > 0) timeString += `${minutes} минут `;
        
        const message = `Ваша сессия была продлена на ${timeString.trim()}.`;
        await sendNotificationToUser(userId, message);
    }

    return result.modifiedCount > 0;
}


// Manager Actions
const ADMIN_USERNAME = 'novaknamechanica1488@gmail.com';
const ADMIN_PASSWORD = 'NovakOgromniyHuy1488';

export async function getManager(username: string, password_raw: string): Promise<{ success: boolean; manager?: Manager; message?: string }> {
    if (username === ADMIN_USERNAME) {
        if (password_raw === ADMIN_PASSWORD) {
            return {
                success: true,
                manager: {
                    _id: new ObjectId().toString(),
                    username: ADMIN_USERNAME,
                    role: 'admin',
                    password: '' // Do not send password to client
                }
            };
        } else {
            return { success: false, message: 'Неверный пароль.' };
        }
    }
    
    const db = await getDb();
    const managersCollection = db.collection<Manager>('managers');
    
    const manager = await managersCollection.findOne({ username });
    if (!manager) {
        return { success: false, message: 'Менеджер не найден.' };
    }

    const isPasswordValid = await bcrypt.compare(password_raw, manager.password);
    if (!isPasswordValid) {
        return { success: false, message: 'Неверный пароль.' };
    }

    const { password, ...managerData } = manager;
    return { success: true, manager: toPlainObject(managerData as WithId<Manager>) as Manager };
}

export async function getAllManagers(): Promise<WithId<Manager>[]> {
    const db = await getDb();
    const managersCollection = db.collection<Manager>('managers');
    const managers = await managersCollection.find({ role: 'manager' }).project({ password: 0 }).toArray();
    return managers.map(m => toPlainObject(m as WithId<Manager>));
}

export async function createManager(username: string, password_raw: string): Promise<{ success: boolean; message?: string }> {
    const db = await getDb();
    const managersCollection = db.collection<Manager>('managers');

    const existingManager = await managersCollection.findOne({ username });
    if (existingManager) {
        return { success: false, message: 'Менеджер с таким именем уже существует.' };
    }

    const hashedPassword = await bcrypt.hash(password_raw, 10);

    const newManager: Omit<Manager, '_id'> = {
        username,
        password: hashedPassword,
        role: 'manager',
    };

    await managersCollection.insertOne(newManager as any);
    return { success: true };
}

export async function deleteManager(managerId: string): Promise<boolean> {
    if (!ObjectId.isValid(managerId)) return false;
    const db = await getDb();
    const managersCollection = db.collection<Manager>('managers');
    
    const result = await managersCollection.deleteOne({ _id: new ObjectId(managerId) });
    return result.deletedCount > 0;
}
