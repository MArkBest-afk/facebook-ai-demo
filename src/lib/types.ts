
import type { ObjectId as MongoObjectId } from 'mongodb';

export type ObjectId = MongoObjectId | string;

export interface Robot {
  id: 'risk-averse' | 'balanced' | 'high-growth';
  name: string;
  riskTolerance: 'low' | 'medium' | 'high';
  investmentGoals: string;
}

export interface Trade {
  id: ObjectId;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  timestamp: Date;
}

export interface Notification {
  id: ObjectId;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatMessage {
  id: ObjectId;
  sender: 'user' | 'admin';
  senderName?: string;
  text: string;
  timestamp: Date;
  read: boolean; // Read by user
  readByAdmin: boolean; // Read by admin
  paymentInfo?: { // For sending raw bank details etc.
    details: string;
  };
  paymentLink?: { // For sending a clickable payment link
    url: string;
    buttonText: string;
  };
}

export interface User {
  _id: ObjectId; // Allow string for client-side representation
  balance: number;
  trades: Trade[];
  selectedRobotId: string | null;
  totalPnl: number;
  sessionStartTime: number | null;
  timeLimit: number;
  isRunning: boolean;
  lastActive: Date;
  createdAt: Date;
  name?: string;
  isBlocked?: boolean;
  isSubscribed?: boolean;
  ipAddress?: string;
  location?: string;
  comment?: string;
  notifications?: Notification[];
  chatMessages?: ChatMessage[];
  isAiChatEnabled?: boolean;
  hasUnreadAdminMessages?: boolean; // Unread messages for admin
  isHotLead?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  duplicates?: User[];
}


export interface Manager {
  _id: ObjectId;
  username: string;
  password: string; // This will be the hashed password
  role: 'admin' | 'manager';
}

export interface GenerateNextStepInput {
  balance: number;
  totalPnl: number;
  isRunning: boolean;
  isHotLead: boolean;
  chatHistory: string;
  timeLimitReached: boolean;
}

export interface GenerateNextStepOutput {
  recommendation: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

    