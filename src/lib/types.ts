export interface Robot {
  id: 'risk-averse' | 'balanced' | 'high-growth';
  name: string;
  riskTolerance: 'low' | 'medium' | 'high';
  investmentGoals: string;
  tradeSizeFactor: number;
  pnlFactor: number;
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
