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
  ipAddress?: string;
  location?: string;
}

    