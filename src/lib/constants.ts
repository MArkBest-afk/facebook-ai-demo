import type { Robot } from './types';

export const ROBOTS: Robot[] = [
  {
    id: 'risk-averse',
    name: 'Risk Averse Robot',
    riskTolerance: 'low',
    investmentGoals: 'Capital preservation with steady, smaller returns.',
  },
  {
    id: 'balanced',
    name: 'Balanced Robot',
    riskTolerance: 'medium',
    investmentGoals: 'A balance between capital preservation and growth.',
  },
  {
    id: 'high-growth',
    name: 'High Growth Robot',
    riskTolerance: 'high',
    investmentGoals: 'Maximize returns with significant risk.',
  },
];

export const INITIAL_BALANCE = 150;

export const TRADING_TIME_LIMIT_SECONDS = 14400;

export const TRADING_SYMBOLS = [
  'BTC/USD',
  'ETH/USD',
  'AAPL',
  'TSLA',
  'Volkswagen',
  'BMW',
  'SpaceX',
  'Samsung',
  'Oil',
  'Gold',
  'Silver'
];
