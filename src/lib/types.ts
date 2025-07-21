import type { ObjectId } from 'mongodb';

export interface Robot {
  id: 'risk-averse' | 'balanced' | 'high-growth';
  name: string;
  riskTolerance: 'low' | 'medium' | 'high';
  investmentGoals: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  timestamp: Date;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatMessage {
  id: string;
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
  _id: ObjectId | string; // Allow string for client-side representation
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
