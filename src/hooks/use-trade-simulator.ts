
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade, User, ChatMessage, ObjectId } from '@/lib/types';
import { ROBOTS, TRADING_SYMBOLS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';
import { getOrCreateUser, updateUser, addTrade, resetUser, getUserById, markNotificationsAsRead, markChatMessagesAsRead } from '@/lib/actions';


const ACCOUNT_ID_STORAGE_KEY = 'tradeSimulatorAccountId';
const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';

function getLeadSignatureFromURL(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lead_sig');
}

export function useTradeSimulator() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>();
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [sessionResetFlag, setSessionResetFlag] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatMessages, setUnreadChatMessages] = useState(0);


  const { toast } = useToast();
  const { t } = useI18n();

  const tradeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef(user);
  useEffect(() => {
      userRef.current = user;
  }, [user]);

  const prevIsRunning = useRef(false);
  const prevSelectedRobotId = useRef<string | null>(null);


  const getRobotName = useCallback((robot: Robot): string => {
    const formattedId = robot.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return t(`robot${formattedId}Name`);
  }, [t]);

  const handleToggleSimulator = useCallback(async () => {
    if (!userRef.current || timeLimitReached || !userRef.current.selectedRobotId) return;
  
    const newIsRunning = !userRef.current.isRunning;
    const updates: Partial<User> = { isRunning: newIsRunning };
  
    if (newIsRunning && !userRef.current.sessionStartTime) {
      updates.sessionStartTime = Date.now();
    }
    
    setUser(prev => prev ? { ...prev, ...updates } : null);
    await updateUser(userRef.current._id.toString(), updates);
  }, [timeLimitReached]);

  const initializeUser = useCallback(async (existingId: string | null = null) => {
    setIsLoading(true);
    try {
      let savedAccountId: string | null = existingId;
      if (!savedAccountId && typeof window !== 'undefined') {
          savedAccountId = localStorage.getItem(ACCOUNT_ID_STORAGE_KEY);
      }
      
      const leadSignature = getLeadSignatureFromURL();
      const userData = await getOrCreateUser(savedAccountId, leadSignature);

      userData.trades = userData.trades || [];
      userData.notifications = userData.notifications || [];
      userData.chatMessages = userData.chatMessages || [];
      
      setUser(userData);
      prevIsRunning.current = userData.isRunning;
      prevSelectedRobotId.current = userData.selectedRobotId;


      if (typeof window !== 'undefined') {
        localStorage.setItem(ACCOUNT_ID_STORAGE_KEY, userData._id.toString());
        // Clear the URL parameter after use
        if (leadSignature) {
            const url = new URL(window.location.href);
            url.searchParams.delete('lead_sig');
            window.history.replaceState({}, document.title, url.toString());
        }
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
  }, [toast, t]);

  // Load user data on mount
  useEffect(() => {
    initializeUser();
  }, [sessionResetFlag, initializeUser]);

  // Notification handler
  useEffect(() => {
    const currentUser = userRef.current;
    if (!currentUser || !currentUser.notifications || currentUser.notifications.length === 0) return;

    const unreadNotifications = currentUser.notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
        const unreadIds = unreadNotifications.map(n => n.id);
        
        unreadNotifications.forEach(n => {
            toast({
                title: "Системное оповещение",
                description: n.message,
                duration: 10000,
            });
        });

        // Mark as read on client
        setUser(prevUser => {
            if (!prevUser || !prevUser.notifications) return prevUser;
            return {
                ...prevUser,
                notifications: prevUser.notifications.map(n => 
                    unreadIds.includes(n.id) ? { ...n, read: true } : n
                ),
            };
        });

        // Mark as read on server
        markNotificationsAsRead(currentUser._id.toString(), unreadIds);
    }
}, [user, toast]);

// Chat message handler
useEffect(() => {
    if (!user || !user.chatMessages) {
        setUnreadChatMessages(0);
        return;
    };

    const unreadCount = user.chatMessages.filter(m => m.sender === 'admin' && !m.read).length;
    setUnreadChatMessages(unreadCount);

    if (isChatOpen && unreadCount > 0 && user._id) {
        const unreadIds = user.chatMessages.filter(m => m.sender === 'admin' && !m.read).map(m => m.id);
        
        // Mark as read on client
        setUser(prevUser => {
            if (!prevUser || !prevUser.chatMessages) return prevUser;
            return {
                ...prevUser,
                chatMessages: prevUser.chatMessages.map(m => 
                    unreadIds.includes(m.id) ? { ...m, read: true } : m
                ),
            };
        });

        // Mark as read on server
        markChatMessagesAsRead(user._id.toString());
    }
}, [user, isChatOpen]);


  // Polling for remote updates
  useEffect(() => {
    const pollForUpdates = async () => {
        const currentUser = userRef.current;
        if (!currentUser || !currentUser._id) return;

        const latestUserData = await getUserById(currentUser._id.toString());
        if (latestUserData) {
            // Check for session reset from admin
            if (currentUser.sessionStartTime && !latestUserData.sessionStartTime) {
                // Session has been reset remotely
                toast({ titleKey: "sessionReset", descriptionKey: "sessionResetDesc" });
                initializeUser(currentUser._id.toString());
                return; // Re-initialization will handle everything
            }

             // Only update if there are meaningful changes to avoid unnecessary re-renders
            if (JSON.stringify(currentUser) !== JSON.stringify(latestUserData)) {
              latestUserData.chatMessages = latestUserData.chatMessages || [];
              setUser(latestUserData);
              if (latestUserData.selectedRobotId) {
                  setSelectedRobot(ROBOTS.find(r => r.id === latestUserData.selectedRobotId) || null);
              } else {
                  setSelectedRobot(null);
              }
            }
        }
    };
    
    // Don't poll while loading or if there's no user
    if (isLoading || !user) return;

    const intervalId = setInterval(pollForUpdates, 5000); // Poll every 5 seconds for chat responsiveness

    return () => clearInterval(intervalId);
  }, [isLoading, user, initializeUser, toast]);


  // Timer logic
  useEffect(() => {
    let clockTimerId: NodeJS.Timeout | null = null;

    if (user?.sessionStartTime && user.timeLimit) {
      const updateElapsedTime = () => {
        if (!userRef.current || !userRef.current.sessionStartTime) return;

        const now = Date.now();
        const currentElapsedTime = Math.floor((now - (userRef.current.sessionStartTime)) / 1000);
        setElapsedTime(currentElapsedTime);

        if (currentElapsedTime >= userRef.current.timeLimit) {
          setTimeLimitReached(true);
          if (userRef.current.isRunning) {
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
  }, [user?.sessionStartTime, user?.timeLimit, handleToggleSimulator]);


  const performTrade = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser || !currentUser.isRunning || !currentUser.selectedRobotId) return;

    const currentRobot = ROBOTS.find(r => r.id === currentUser.selectedRobotId);
    if (!currentRobot) return;

    if (currentUser.balance < 10) return;

    const tradeAmount = Math.random() * (10 - 5) + 5;
    const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
    const entryPrice = Math.random() * 100 + 100;
    const quantity = tradeAmount / entryPrice;

    // Custom P/L logic
    const isFirstTrade = currentUser.trades.length === 0;
    const lastTwoTrades = currentUser.trades.slice(0, 2);
    const hasTwoConsecutiveLosses = lastTwoTrades.length === 2 && lastTwoTrades.every(t => t.pnl < 0);

    let pnl;

    if (isFirstTrade || hasTwoConsecutiveLosses) {
      // Force a profitable trade
      const pnlFactor = Math.random() * 0.05 + 0.01; // Profitable factor between 1% and 6%
      pnl = tradeAmount * pnlFactor;
    } else {
      // Standard random trade logic
      let pnlFactor;
      switch (currentRobot.riskTolerance) {
          case 'low': pnlFactor = (Math.random() - 0.45) * 0.05; break;
          case 'medium': pnlFactor = (Math.random() - 0.42) * 0.08; break;
          case 'high': pnlFactor = (Math.random() - 0.40) * 0.12; break;
          default: pnlFactor = (Math.random() - 0.5) * 0.05;
      }
      pnl = tradeAmount * pnlFactor;
    }
    
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

    if (currentUser._id) {
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
    }


    if (userRef.current?.isRunning) {
        const nextInterval = Math.random() * (60000 - 5000) + 5000;
        tradeTimerRef.current = setTimeout(performTrade, nextInterval);
    }
  }, []);

  useEffect(() => {
    if (tradeTimerRef.current) {
      clearTimeout(tradeTimerRef.current);
      tradeTimerRef.current = null;
    }
    if (user?.isRunning) {
      const firstTradeDelay = Math.random() * 4000 + 1000;
      tradeTimerRef.current = setTimeout(performTrade, firstTradeDelay);
    }
    
    return () => {
        if (tradeTimerRef.current) {
            clearTimeout(tradeTimerRef.current);
        }
    };
  }, [user?.isRunning, performTrade]);

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
      toast({ titleKey: "robotSelected", titleParams: { robotName }, descriptionKey: "robotSelectedDesc" });
      prevSelectedRobotId.current = currentRobotId;
    }
  }, [user?.isRunning, user?.selectedRobotId, isLoading, getRobotName, toast]);
  
  useEffect(() => {
    if (sessionResetFlag > 0) {
      toast({ titleKey: "sessionReset", descriptionKey: "sessionResetDesc" });
    }
  }, [sessionResetFlag, toast]);


  const handleSelectRobot = useCallback(async (robot: Robot) => {
    if (!user || !user._id) return;
    setSelectedRobot(robot);
    const updatedUser = { ...user, selectedRobotId: robot.id };
    setUser(updatedUser);
    await updateUser(user._id.toString(), { selectedRobotId: robot.id });
  }, [user]);

  const resetSimulator = useCallback(async (mode: 'normal' | 'demo' = 'normal') => {
    if (!user || !user._id) return;
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

  const handleNewChatMessage = useCallback(async (sentMessage?: Partial<ChatMessage>) => {
    const currentUser = userRef.current;
    if (!currentUser || !currentUser._id) return;

    if (sentMessage) {
        setUser(prevUser => {
            if (!prevUser) return null;
            // Optimistically update the UI with the new message
            const newMessages = [...(prevUser.chatMessages || []), sentMessage as ChatMessage];
            return { ...prevUser, chatMessages: newMessages };
        });
    }

    // Now, fetch the latest state from the server which will include the AI response
    // The polling mechanism will also catch this, but an immediate fetch provides a better UX
    const latestUserData = await getUserById(currentUser._id.toString());
    if (latestUserData) {
        latestUserData.chatMessages = latestUserData.chatMessages || [];
        setUser(latestUserData);
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
    isBlocked: user?.isBlocked ?? false,
    isLoading,
    chatMessages: user?.chatMessages ?? [],
    isChatOpen,
    unreadChatMessages,
    setIsChatOpen,
    handleNewChatMessage,
  };
}
