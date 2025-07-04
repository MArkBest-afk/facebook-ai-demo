'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';

const TRADE_SIMULATOR_STORAGE_KEY = 'tradeSimulatorState';

export function useTradeSimulator() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(true);
  const [totalTradingTime, setTotalTradingTime] = useState(0); // in seconds
  const [timeLimitReached, setTimeLimitReached] = useState(false);

  const { toast } = useToast();
  const { t } = useI18n();

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
        setTutorialCompleted(savedState.tutorialCompleted ?? false);
        setTotalTradingTime(savedState.totalTradingTime ?? 0);
        
        const limitReached = (savedState.totalTradingTime ?? 0) >= TRADING_TIME_LIMIT_SECONDS;
        setTimeLimitReached(limitReached);

        if (savedState.isRunning && savedState.selectedRobot && !limitReached) {
          setIsRunning(true);
        }
      } else {
        setTutorialCompleted(false);
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      setTutorialCompleted(false);
    }
  }, []);

  const completeTutorial = useCallback(() => {
    setTutorialCompleted(true);
  }, []);

  useEffect(() => {
    try {
      const stateToSave = {
        balance,
        trades,
        selectedRobot,
        totalPnl,
        isRunning,
        tutorialCompleted,
        totalTradingTime,
        timeLimitReached,
      };
      localStorage.setItem(TRADE_SIMULATOR_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [balance, trades, selectedRobot, totalPnl, isRunning, tutorialCompleted, totalTradingTime, timeLimitReached]);

  useEffect(() => {
    if (!isRunning || timeLimitReached) return;

    const interval = setInterval(() => {
      setTotalTradingTime(prevTime => prevTime + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLimitReached]);

  useEffect(() => {
    if (totalTradingTime >= TRADING_TIME_LIMIT_SECONDS && isRunning) {
      setIsRunning(false);
      setTimeLimitReached(true);
      toast({
        titleKey: 'timeLimitReachedTitle',
        descriptionKey: 'timeLimitReachedDesc',
        variant: 'destructive',
        duration: 10000,
      });
    }
  }, [totalTradingTime, isRunning, toast]);

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
        if (isRunning) {
          scheduleNextTrade();
        }
      }, randomInterval);
    };

    scheduleNextTrade();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isRunning, runTradeCycle]);

  const getRobotName = useCallback((robot: Robot) => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Name`;
    return t(key);
  }, [t]);

  const handleSelectRobot = (robot: Robot) => {
    if (isRunning) {
      toast({
        titleKey: "simulatorPaused",
        descriptionKey: "simulatorPausedDesc",
      });
      setIsRunning(false);
    }
    setSelectedRobot(robot);
    
    const robotName = getRobotName(robot);
    toast({
        titleKey: "robotSelected",
        titleParams: { robotName },
        descriptionKey: "robotSelectedDesc",
    });
  };

  const handleToggleSimulator = () => {
    if (timeLimitReached) {
      toast({
        titleKey: 'timeLimitReachedTitle',
        descriptionKey: 'timeLimitReachedDesc',
        variant: 'destructive',
        duration: 10000,
      });
      return;
    }

    if (isRunning) {
      setIsRunning(false);
       toast({
        titleKey: "tradingStopped",
        descriptionKey: "tradingStoppedDesc",
      });
    } else if (selectedRobot) {
      setIsRunning(true);
      const robotName = getRobotName(selectedRobot);
      toast({
          titleKey: "tradingStarted",
          descriptionKey: "tradingStartedDesc",
          descriptionParams: { robotName },
      });
    }
  }

  const resetSimulator = () => {
    setIsRunning(false);
    setBalance(INITIAL_BALANCE);
    setTrades([]);
    setSelectedRobot(null);
    setTotalPnl(0);
    setTutorialCompleted(false);
    setTotalTradingTime(0);
    setTimeLimitReached(false);
    toast({
      titleKey: "sessionReset",
      descriptionKey: "sessionResetDesc",
    });
    // Force a reload to ensure tutorial pops up
    setTimeout(() => window.location.reload(), 500);
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
    tutorialCompleted,
    completeTutorial,
    totalTradingTime,
    timeLimitReached,
  };
}
