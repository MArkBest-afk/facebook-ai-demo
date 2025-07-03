import type { Robot } from './types';

export const ROBOTS: Robot[] = [
  {
    id: 'risk-averse',
    name: 'Risk Averse Robot',
    riskTolerance: 'low',
    investmentGoals: 'Capital preservation with steady, smaller returns.',
    tradeProbability: 0.2,
    tradeSizeFactor: 0.5,
    pnlFactor: 0.2,
  },
  {
    id: 'balanced',
    name: 'Balanced Robot',
    riskTolerance: 'medium',
    investmentGoals: 'A balance between capital preservation and growth.',
    tradeProbability: 0.4,
    tradeSizeFactor: 1,
    pnlFactor: 0.5,
  },
  {
    id: 'high-growth',
    name: 'High Growth Robot',
    riskTolerance: 'high',
    investmentGoals: 'Maximize returns with significant risk.',
    tradeProbability: 0.7,
    tradeSizeFactor: 1.5,
    pnlFactor: 1,
  },
];

export const INITIAL_BALANCE = 10000;
