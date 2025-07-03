'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { INITIAL_BALANCE } from '@/lib/constants';
import { useToast } from './use-toast';

const TRADE_SIMULATOR_STORAGE_KEY = 'tradeSimulatorState';

export function useTradeSimulator() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(TRADE_SIMULATOR_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        setBalance(savedState.balance ?? INITIAL_BALANCE);
        const parsedTrades = (savedState.trades ?? []).map((trade: any) => ({
          ...trade,
          timestamp: new Date(trade.timestamp),
        }));
        setTrades(parsedTrades);
        setSelectedRobot(savedState.selectedRobot ?? null);
        setTotalPnl(savedState.totalPnl ?? 0);
        if (savedState.isRunning && savedState.selectedRobot) {
          setIsRunning(true);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      setBalance(INITIAL_BALANCE);
      setTrades([]);
      setSelectedRobot(null);
      setTotalPnl(0);
    }
  }, []);

  useEffect(() => {
    try {
      const stateToSave = {
        balance,
        trades,
        selectedRobot,
        totalPnl,
        isRunning,
      };
      localStorage.setItem(TRADE_SIMULATOR_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [balance, trades, selectedRobot, totalPnl, isRunning]);

  const runTradeCycle = useCallback(() => {
    if (!selectedRobot) return;

    if (Math.random() <= selectedRobot.tradeProbability) {
      const entryPrice = 100 + (Math.random() - 0.5) * 10;
      const quantity = Math.floor((Math.random() * 5 + 1) * selectedRobot.tradeSizeFactor);
      
      const isProfitable = Math.random() < 0.7; // 70% chance of profit
      const pnlMagnitude = (Math.random() * 5 + 1) * selectedRobot.pnlFactor;
      const pnlMultiplier = isProfitable ? pnlMagnitude : -pnlMagnitude / 2; // Losses are smaller

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
        titleKey: "simulatorPaused",
        descriptionKey: "simulatorPausedDesc",
      });
      setIsRunning(false);
    }
    setSelectedRobot(robot);
    toast({
      titleKey: "robotSelected",
      titleParams: { robotName: robot.name },
      descriptionKey: "robotSelectedDesc",
    });
  };

  const handleToggleSimulator = () => {
    if (isRunning) {
      setIsRunning(false);
       toast({
        titleKey: "tradingStopped",
        descriptionKey: "tradingStoppedDesc",
      });
    } else if (selectedRobot) {
      setIsRunning(true);
      toast({
        titleKey: "tradingStarted",
        descriptionKey: "tradingStartedDesc",
        descriptionParams: { robotName: selectedRobot.name },
      });
    }
  }

  const resetSimulator = () => {
    setIsRunning(false);
    setBalance(INITIAL_BALANCE);
    setTrades([]);
    setSelectedRobot(null);
    setTotalPnl(0);
    try {
      localStorage.removeItem(TRADE_SIMULATOR_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove trade simulator state from localStorage", error);
    }
    toast({
      titleKey: "sessionReset",
      descriptionKey: "sessionResetDesc",
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
