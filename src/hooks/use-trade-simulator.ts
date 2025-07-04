'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Robot, Trade } from '@/lib/types';
import { INITIAL_BALANCE, TRADING_TIME_LIMIT_SECONDS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';
import { useIsMobile } from './use-mobile';

const ALL_USERS_STORAGE_KEY = 'tradeSimulatorAllUsersState';
const SESSION_USER_ID_KEY = 'tradeSimulatorSessionUserId';

export function useTradeSimulator() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [totalPnl, setTotalPnl] = useState(0);
  const [tutorialCompleted, setTutorialCompleted] = useState(true);
  const [totalTradingTime, setTotalTradingTime] = useState(0);
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();
  const isMobile = useIsMobile();

  const getRobotName = useCallback((robot: Robot): string => {
    const formattedId = robot.id
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    const key = `robot${formattedId}Name`;
    return t(key);
  }, [t]);

  useEffect(() => {
    try {
      let sessionUserId = sessionStorage.getItem(SESSION_USER_ID_KEY);
      if (!sessionUserId) {
        sessionUserId = 'acc-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        sessionStorage.setItem(SESSION_USER_ID_KEY, sessionUserId);
      }
      setUserId(sessionUserId);

      const allUsersStateJSON = localStorage.getItem(ALL_USERS_STORAGE_KEY);
      const allUsersState = allUsersStateJSON ? JSON.parse(allUsersStateJSON) : {};
      const savedState = allUsersState[sessionUserId];

      if (savedState) {
        setBalance(savedState.balance ?? INITIAL_BALANCE);
        const parsedTrades = (savedState.trades ?? []).map((trade: any) => ({
          ...trade,
          timestamp: new Date(trade.timestamp),
        }));
        setTrades(parsedTrades);
        setSelectedRobot(savedState.selectedRobot ?? null);
        setTotalPnl(savedState.totalPnl ?? 0);
        setTutorialCompleted(savedState.tutorialCompleted ?? true);
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
      if (!sessionStorage.getItem(SESSION_USER_ID_KEY)) {
        const sessionUserId = 'acc-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        sessionStorage.setItem(SESSION_USER_ID_KEY, sessionUserId);
        setUserId(sessionUserId);
      }
    }
  }, []);

  const completeTutorial = useCallback(() => {
    setTutorialCompleted(true);
  }, []);

  useEffect(() => {
    if (!userId) return;
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
        userId,
        device: isMobile ? 'Mobile' : 'Desktop',
        lastSeenTimestamp: new Date().toISOString(),
      };
      
      const allUsersStateJSON = localStorage.getItem(ALL_USERS_STORAGE_KEY);
      const allUsersState = allUsersStateJSON ? JSON.parse(allUsersStateJSON) : {};
      
      allUsersState[userId] = stateToSave;

      localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(allUsersState));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [balance, trades, selectedRobot, totalPnl, isRunning, tutorialCompleted, totalTradingTime, timeLimitReached, userId, isMobile]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !timeLimitReached) {
      timer = setInterval(() => {
        setTotalTradingTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLimitReached]);

  useEffect(() => {
    if (totalTradingTime >= TRADING_TIME_LIMIT_SECONDS) {
      if (isRunning) {
        setIsRunning(false);
      }
      if (!timeLimitReached) {
        setTimeLimitReached(true);
      }
    }
  }, [totalTradingTime, isRunning, timeLimitReached]);

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
      const randomInterval = 5000 + Math.random() * 55000;
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
    
    try {
      if (userId) {
        const allUsersStateJSON = localStorage.getItem(ALL_USERS_STORAGE_KEY);
        const allUsersState = allUsersStateJSON ? JSON.parse(allUsersStateJSON) : {};
        delete allUsersState[userId];
        localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(allUsersState));
      }
      sessionStorage.removeItem(SESSION_USER_ID_KEY);
    } catch (error) {
      console.error("Failed to remove user from storage on reset", error);
    }

    toast({
      titleKey: "sessionReset",
      descriptionKey: "sessionResetDesc",
    });
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
    userId,
  };
}
