import type { Robot } from './types';

export const ROBOTS: Robot[] = [
  {
    id: 'risk-averse',
    name: 'Risk Averse Robot',
    riskTolerance: 'low',
    investmentGoals: 'Capital preservation with steady, smaller returns.',
    pnlFactor: 0.64,
  },
  {
    id: 'balanced',
    name: 'Balanced Robot',
    riskTolerance: 'medium',
    investmentGoals: 'A balance between capital preservation and growth.',
    pnlFactor: 0.81,
  },
  {
    id: 'high-growth',
    name: 'High Growth Robot',
    riskTolerance: 'high',
    investmentGoals: 'Maximize returns with significant risk.',
    pnlFactor: 1.0,
  },
];

export const INITIAL_BALANCE = 150;

export const TRADING_TIME_LIMIT_SECONDS = 14400;
