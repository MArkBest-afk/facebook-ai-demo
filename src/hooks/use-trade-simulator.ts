'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade, User } from '@/lib/types';
import { ROBOTS, TRADING_SYMBOLS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';
import { getOrCreateUser, updateUser, addTrade, resetUser } from '@/lib/actions';
import { ObjectId } from 'mongodb';

const ACCOUNT_ID_STORAGE_KEY = 'tradeSimulatorAccountId';
const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';

export function useTradeSimulator() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>();
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [sessionResetFlag, setSessionResetFlag] = useState(0);

  const { toast } = useToast();
  const { t } = useI18n();

  const tradeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const userRef = useRef(user);

  // References to track previous state for useEffect dependencies
  const prevIsRunning = useRef(false);
  const prevSelectedRobotId = useRef<string | null>(null);


  useEffect(() => {
    userRef.current = user;
    if (user) {
      isRunningRef.current = user.isRunning;
    }
  }, [user]);

  const getRobotName = useCallback((robot: Robot): string => {
    const formattedId = robot.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return t(`robot${formattedId}Name`);
  }, [t]);

  // Load user data on mount
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);
      try {
        let savedAccountId: string | null = null;
        if (typeof window !== 'undefined') {
            savedAccountId = localStorage.getItem(ACCOUNT_ID_STORAGE_KEY);
        }
        
        const userData = await getOrCreateUser(savedAccountId);

        // Ensure trades is always an array
        userData.trades = userData.trades || [];
        
        setUser(userData);

        if (typeof window !== 'undefined') {
          localStorage.setItem(ACCOUNT_ID_STORAGE_KEY, userData._id.toString());
        }

        const robot = ROBOTS.find(r => r.id === userData.selectedRobotId) || null;
        setSelectedRobot(robot);

        if (typeof window !== 'undefined') {
          const savedTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEY);
          setTutorialCompleted(savedTutorial === 'true');
        } else {
          setTutorialCompleted(false);
        }
      } catch (error) {
        console.error("Failed to initialize user:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load user data.' });
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [sessionResetFlag]); // Re-run on session reset

  // Timer logic
  useEffect(() => {
    let clockTimerId: NodeJS.Timeout | null = null;

    if (user?.sessionStartTime && user.timeLimit) {
      const updateElapsedTime = () => {
        const now = Date.now();
        const currentElapsedTime = Math.floor((now - (user.sessionStartTime as number)) / 1000);
        setElapsedTime(currentElapsedTime);

        if (currentElapsedTime >= user.timeLimit) {
          setTimeLimitReached(true);
          if (user.isRunning) {
            handleToggleSimulator(); // Stop the simulator
          }
          if (clockTimerId) clearInterval(clockTimerId);
        }
      };
      updateElapsedTime();
      clockTimerId = setInterval(updateElapsedTime, 1000);
    } else {
        setElapsedTime(0);
    }

    return () => {
      if (clockTimerId) clearInterval(clockTimerId);
    };
  }, [user?.sessionStartTime, user?.timeLimit, user?.isRunning]);


  const performTrade = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !isRunningRef.current || !currentUser.selectedRobotId) return;

    const currentRobot = ROBOTS.find(r => r.id === currentUser.selectedRobotId);
    if (!currentRobot) return;

    if (currentUser.balance < 10) return;

    const tradeAmount = Math.random() * (10 - 5) + 5;
    const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
    const entryPrice = Math.random() * 100 + 100;
    const quantity = tradeAmount / entryPrice;

    let pnlFactor;
    switch (currentRobot.riskTolerance) {
        case 'low': pnlFactor = (Math.random() - 0.40) * 0.05; break;
        case 'medium': pnlFactor = (Math.random() - 0.38) * 0.08; break;
        case 'high': pnlFactor = (Math.random() - 0.35) * 0.12; break;
        default: pnlFactor = (Math.random() - 0.5) * 0.05;
    }
    
    const pnl = tradeAmount * pnlFactor;
    const exitPrice = entryPrice + (pnl / quantity);

    const newTradeData = {
      symbol,
      type: pnl > 0 ? 'BUY' : 'SELL', // simplified logic
      quantity: parseFloat(quantity.toFixed(4)),
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      exitPrice: parseFloat(exitPrice.toFixed(2)),
      pnl: parseFloat(pnl.toFixed(2)),
      timestamp: new Date(),
    };

    const createdTrade = await addTrade(currentUser._id.toString(), newTradeData);
    if (createdTrade) {
      setUser(prevUser => {
        if (!prevUser) return null;
        const newPnl = prevUser.totalPnl + createdTrade.pnl;
        const newBalance = prevUser.balance + createdTrade.pnl;
        const newTrades = [createdTrade, ...(prevUser.trades || [])];
        return { ...prevUser, trades: newTrades, totalPnl: newPnl, balance: newBalance };
      });
    }

    const nextInterval = Math.random() * (60000 - 5000) + 5000;
    tradeTimerRef.current = setTimeout(performTrade, nextInterval);
  }, []);

  // Effect to start/stop trading loop
  useEffect(() => {
    if (tradeTimerRef.current) {
      clearTimeout(tradeTimerRef.current);
      tradeTimerRef.current = null;
    }
    if (user?.isRunning) {
      const firstTradeDelay = Math.random() * 4000 + 1000;
      tradeTimerRef.current = setTimeout(performTrade, firstTradeDelay);
    }
  }, [user?.isRunning, performTrade]);

  // Toast notifications for start/stop/robot change
  useEffect(() => {
    if (isLoading || !user) return;

    const currentIsRunning = user.isRunning;
    const currentRobotId = user.selectedRobotId;
    const robotName = currentRobotId ? getRobotName(ROBOTS.find(r => r.id === currentRobotId)!) : '';

    if (currentIsRunning !== prevIsRunning.current) {
      if (currentIsRunning && robotName) {
        toast({ titleKey: "tradingStarted", descriptionKey: "tradingStartedDesc", descriptionParams: { robotName } });
      } else if (!currentIsRunning) {
        toast({ titleKey: "tradingStopped", descriptionKey: "tradingStoppedDesc" });
      }
      prevIsRunning.current = currentIsRunning;
    }

    if (currentRobotId !== prevSelectedRobotId.current && robotName) {
       if(currentIsRunning) {
        handleToggleSimulator(); // Pause simulator on robot change
        toast({ titleKey: "simulatorPaused", descriptionKey: "simulatorPausedDesc" });
      }
      toast({ titleKey: "robotSelected", titleParams: { robotName }, descriptionKey: "robotSelectedDesc" });
      prevSelectedRobotId.current = currentRobotId;
    }
  }, [user?.isRunning, user?.selectedRobotId, isLoading]);
  
  // Toast notification for session reset
  useEffect(() => {
    if (sessionResetFlag > 0) {
      toast({ titleKey: "sessionReset", descriptionKey: "sessionResetDesc" });
    }
  }, [sessionResetFlag]);


  const handleSelectRobot = useCallback(async (robot: Robot) => {
    if (!user) return;
    setSelectedRobot(robot);
    const updatedUser = { ...user, selectedRobotId: robot.id };
    setUser(updatedUser);
    await updateUser(user._id.toString(), { selectedRobotId: robot.id });
  }, [user]);

  const handleToggleSimulator = async () => {
    if (!user || timeLimitReached || !selectedRobot) return;

    const newIsRunning = !user.isRunning;
    const updates: Partial<User> = { isRunning: newIsRunning };

    if (newIsRunning && !user.sessionStartTime) {
      updates.sessionStartTime = Date.now();
    }
    
    setUser(prev => prev ? { ...prev, ...updates } : null);
    await updateUser(user._id.toString(), updates);
  };
  
  const resetSimulator = useCallback(async (mode: 'normal' | 'demo' = 'normal') => {
    if (!user) return;
    const updatedUser = await resetUser(user._id.toString(), mode);
    if (updatedUser) {
        setUser(updatedUser);
        setSelectedRobot(null);
        setTimeLimitReached(false);
        setTutorialCompleted(false);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(TUTORIAL_STORAGE_KEY, 'false');
          }
        } catch (error) {
          console.error("Failed to clear tutorial state from localStorage", error);
        }
        setSessionResetFlag(f => f + 1);
    }
  }, [user]);

  const completeTutorial = useCallback(() => {
    setTutorialCompleted(true);
    try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TUTORIAL_STORAGE_KEY, String(true));
        }
      } catch (error) {
        console.error("Failed to save tutorial state to localStorage", error);
      }
  }, []);

  return {
    accountId: user?._id.toString() ?? '',
    balance: user?.balance ?? 0,
    trades: user?.trades ?? [],
    isRunning: user?.isRunning ?? false,
    selectedRobot,
    totalPnl: user?.totalPnl ?? 0,
    handleSelectRobot,
    handleToggleSimulator,
    resetSimulator,
    tutorialCompleted,
    completeTutorial,
    totalTradingTime: elapsedTime,
    timeLimitReached,
    timeLimit: user?.timeLimit ?? 0,
    isLoading,
  };
}
