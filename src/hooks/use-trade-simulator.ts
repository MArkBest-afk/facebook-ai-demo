'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { INITIAL_BALANCE } from '@/lib/constants';
import { useToast } from './use-toast';

const SIMULATION_INTERVAL_MS = 2000;

export function useTradeSimulator() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);

  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopSimulator = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startSimulator = useCallback(() => {
    if (!selectedRobot || isRunning) return;

    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      if (Math.random() > selectedRobot.tradeProbability) {
        return;
      }

      const entryPrice = 100 + (Math.random() - 0.5) * 10;
      const quantity = Math.floor((Math.random() * 5 + 1) * selectedRobot.tradeSizeFactor);
      const pnlMultiplier = (Math.random() - 0.35) * 10 * selectedRobot.pnlFactor;
      const pnl = pnlMultiplier * quantity;
      const exitPrice = entryPrice + pnlMultiplier;

      const newTrade: Trade = {
        id: new Date().toISOString() + Math.random(),
        symbol: 'BTC-USDT',
        type: pnl > 0 ? 'BUY' : 'SELL',
        quantity,
        entryPrice,
        exitPrice,
        pnl,
        timestamp: new Date(),
      };
      
      setTrades(prev => [newTrade, ...prev].slice(0, 100));
      setBalance(prev => prev + pnl);
      setTotalPnl(prev => prev + pnl);

    }, SIMULATION_INTERVAL_MS);
  }, [selectedRobot, isRunning]);

  useEffect(() => {
    return () => stopSimulator();
  }, [stopSimulator]);

  const handleSelectRobot = (robot: Robot) => {
    if (isRunning) {
      toast({
        title: "Simulator Paused",
        description: "Robot changed. The simulator has been paused.",
      });
      stopSimulator();
    }
    setSelectedRobot(robot);
    toast({
      title: `${robot.name} Selected`,
      description: "Ready to start trading.",
    });
  };

  const handleToggleSimulator = () => {
    if (isRunning) {
      stopSimulator();
       toast({
        title: "Trading Stopped",
        description: "The robot has been paused.",
      });
    } else if (selectedRobot) {
      startSimulator();
      toast({
        title: "Trading Started!",
        description: `${selectedRobot.name} is now actively trading.`,
      });
    }
  }

  const resetSimulator = () => {
    stopSimulator();
    setBalance(INITIAL_BALANCE);
    setTrades([]);
    setSelectedRobot(null);
    setTotalPnl(0);
    toast({
      title: "Session Reset",
      description: "Your account has been reset to the initial state.",
    });
  }

  return {
    balance,
    trades,
    isRunning,
    selectedRobot,
    totalPnl,
    handleSelectRobot,
    handleToggleSimulator,
    resetSimulator,
  };
}
