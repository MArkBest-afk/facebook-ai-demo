'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { INITIAL_BALANCE } from '@/lib/constants';
import { useToast } from './use-toast';

export function useTradeSimulator() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);

  const { toast } = useToast();

  const runTradeCycle = useCallback(() => {
    if (!selectedRobot) return;

    if (Math.random() <= selectedRobot.tradeProbability) {
      const entryPrice = 100 + (Math.random() - 0.5) * 10;
      const quantity = Math.floor((Math.random() * 5 + 1) * selectedRobot.tradeSizeFactor);
      const pnlMultiplier = (Math.random() - 0.3) * 10 * selectedRobot.pnlFactor;
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
    }
  }, [selectedRobot]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const scheduleNextTrade = () => {
      const randomInterval = 5000 + Math.random() * 55000; // 5 seconds to 1 minute
      timeoutId = setTimeout(() => {
        runTradeCycle();
        scheduleNextTrade();
      }, randomInterval);
    };

    scheduleNextTrade();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isRunning, runTradeCycle]);

  const handleSelectRobot = (robot: Robot) => {
    if (isRunning) {
      toast({
        title: "Simulator Paused",
        description: "Robot changed. The simulator has been paused.",
      });
      setIsRunning(false);
    }
    setSelectedRobot(robot);
    toast({
      title: `${robot.name} Selected`,
      description: "Ready to start trading.",
    });
  };

  const handleToggleSimulator = () => {
    if (isRunning) {
      setIsRunning(false);
       toast({
        title: "Trading Stopped",
        description: "The robot has been paused.",
      });
    } else if (selectedRobot) {
      setIsRunning(true);
      toast({
        title: "Trading Started!",
        description: `${selectedRobot.name} is now actively trading.`,
      });
    }
  }

  const resetSimulator = () => {
    setIsRunning(false);
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
