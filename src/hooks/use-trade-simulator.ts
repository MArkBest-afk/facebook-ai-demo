
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Robot, Trade, User, ChatMessage, ObjectId } from '@/lib/types';
import { ROBOTS, TRADING_SYMBOLS } from '@/lib/constants';
import { useToast } from './use-toast';
import { useI18n } from './use-i18n';
import { getOrCreateUser, updateUser, addTrade, resetUser, getUserById, markNotificationsAsRead, markChatMessagesAsRead, sendChatMessage } from '@/lib/actions';


const ACCOUNT_ID_STORAGE_KEY = 'tradeSimulatorAccountId';
const TUTORIAL_STORAGE_KEY = 'tradeSimulatorTutorialCompleted';

function getLeadSignatureFromURL(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lead_sig');
}

export function useTradeSimulator({ isChatOpen }: { isChatOpen: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>();
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLimitReached, setTimeLimitReached] = useState(false);
  const [sessionResetFlag, setSessionResetFlag] = useState(0);
  const [unreadChatMessages, setUnreadChatMessages] = useState(0);


  const { toast } = useToast();
  const { t } = useI18n();

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
    
    const currentLocalUser = userRef.current;
    const updatedLocalUser = { ...currentLocalUser, ...updates };
    setUser(updatedLocalUser);
    
    await updateUser(userRef.current._id.toString(), updates);
    
  }, [timeLimitReached]);


  const initializeUser = useCallback(async (existingId: string | null = null) => {
    setIsLoading(true);
    try {
        let savedAccountId: string | null = existingId;
        const leadSignature = getLeadSignatureFromURL();

        if (!leadSignature && typeof window !== 'undefined') {
            savedAccountId = localStorage.getItem(ACCOUNT_ID_STORAGE_KEY);
        }
      
      const userData = await getOrCreateUser(savedAccountId, leadSignature);

      userData.trades = userData.trades || [];
      userData.notifications = userData.notifications || [];
      userData.chatMessages = userData.chatMessages || [];
      
      setUser(userData);
      prevIsRunning.current = userData.isRunning;
      prevSelectedRobotId.current = userData.selectedRobotId;


      if (typeof window !== 'undefined') {
        localStorage.setItem(ACCOUNT_ID_STORAGE_KEY, userData._id.toString());
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
  }, [toast]);

  useEffect(() => {
    initializeUser();
  }, [sessionResetFlag, initializeUser]);

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

        setUser(prevUser => {
            if (!prevUser || !prevUser.notifications) return prevUser;
            return {
                ...prevUser,
                notifications: prevUser.notifications.map(n => 
                    unreadIds.includes(n.id) ? { ...n, read: true } : n
                ),
            };
        });

        markNotificationsAsRead(currentUser._id.toString(), unreadIds);
    }
}, [user, toast]);

useEffect(() => {
    if (!user || !user.chatMessages) {
        setUnreadChatMessages(0);
        return;
    };

    const unreadCount = user.chatMessages.filter(m => m.sender === 'admin' && !m.read).length;
    setUnreadChatMessages(unreadCount);

    if (isChatOpen && unreadCount > 0 && user._id) {
        const unreadIds = user.chatMessages.filter(m => m.sender === 'admin' && !m.read).map(m => m.id);
        
        setUser(prevUser => {
            if (!prevUser || !prevUser.chatMessages) return prevUser;
            return {
                ...prevUser,
                chatMessages: prevUser.chatMessages.map(m => 
                    unreadIds.includes(m.id) ? { ...m, read: true } : m
                ),
            };
        });

        markChatMessagesAsRead(user._id.toString());
    }
}, [user, isChatOpen]);


  useEffect(() => {
    const pollForUpdates = async () => {
        const currentUser = userRef.current;
        if (!currentUser || !currentUser._id) return;

        try {
            const latestUserData = await getUserById(currentUser._id.toString());
            if (latestUserData) {
                if (currentUser.sessionStartTime && !latestUserData.sessionStartTime) {
                    toast({ titleKey: "sessionReset", descriptionKey: "sessionResetDesc" });
                    initializeUser(currentUser._id.toString());
                    return; 
                }

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
        } catch (error) {
            console.error("Polling error:", error);
        }
    };
    
    if (isLoading) return;

    const intervalId = setInterval(pollForUpdates, 5000); 

    return () => clearInterval(intervalId);
  }, [isLoading, initializeUser, toast]);


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
            handleToggleSimulator();
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

  useEffect(() => {
    let tradeInterval: NodeJS.Timeout | null = null;

    if (user?.isRunning) {
        tradeInterval = setInterval(async () => {
            // Use ref to get the latest state without causing re-renders
            const currentUser = userRef.current;
            if (!currentUser || !currentUser.isRunning || !currentUser.selectedRobotId || currentUser.balance < 10) {
                return;
            }

            // Probability-based trade execution (e.g., ~once every 15 seconds on average)
            const tradeProbability = 1 / 15;
            if (Math.random() > tradeProbability) {
                return;
            }

            const currentRobot = ROBOTS.find(r => r.id === currentUser.selectedRobotId);
            if (!currentRobot) return;
            
            const tradeAmount = Math.random() * (10 - 5) + 5;
            const symbol = TRADING_SYMBOLS[Math.floor(Math.random() * TRADING_SYMBOLS.length)];
            const entryPrice = Math.random() * 100 + 100;
            const quantity = tradeAmount / entryPrice;

            const isFirstTrade = !currentUser.trades || currentUser.trades.length === 0;
            const lastTwoTrades = (currentUser.trades || []).slice(0, 2);
            const hasTwoConsecutiveLosses = lastTwoTrades.length === 2 && lastTwoTrades.every(t => t.pnl < 0);

            let pnl;
            if (isFirstTrade || hasTwoConsecutiveLosses) {
                pnl = tradeAmount * (Math.random() * 0.05 + 0.01); // Guaranteed profit
            } else {
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
                type: pnl > 0 ? 'BUY' : 'SELL',
                quantity: parseFloat(quantity.toFixed(4)),
                entryPrice: parseFloat(entryPrice.toFixed(2)),
                exitPrice: parseFloat(exitPrice.toFixed(2)),
                pnl: parseFloat(pnl.toFixed(2)),
                timestamp: new Date(),
            };

            if (currentUser._id) {
                const createdTrade = await addTrade(currentUser._id.toString(), newTradeData);
                if (createdTrade) {
                    const latestUser = await getUserById(currentUser._id.toString());
                    if (latestUser) setUser(latestUser);
                }
            }
        }, 1000); // Check every second
    }

    // Cleanup and toast logic
    if (isLoading) return () => { if (tradeInterval) clearInterval(tradeInterval); };

    const currentIsRunning = user?.isRunning ?? false;
    const currentRobotId = user?.selectedRobotId;
    const robot = currentRobotId ? ROBOTS.find(r => r.id === currentRobotId) : null;
    const robotName = robot ? getRobotName(robot) : '';

    if (currentIsRunning !== prevIsRunning.current) {
      if (currentIsRunning && robotName) {
        toast({ titleKey: "tradingStarted", descriptionKey: "tradingStartedDesc", descriptionParams: { robotName } });
      } else if (!currentIsRunning) {
        toast({ titleKey: "tradingStopped", descriptionKey: "tradingStoppedDesc" });
      }
    }

    if (currentRobotId !== prevSelectedRobotId.current && robotName) {
      toast({ titleKey: "robotSelected", titleParams: { robotName }, descriptionKey: "robotSelectedDesc" });
    }

    prevIsRunning.current = currentIsRunning;
    prevSelectedRobotId.current = currentRobotId;

    return () => {
        if (tradeInterval) clearInterval(tradeInterval);
    };

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

  const handleNewChatMessage = useCallback(async (sentMessage: Partial<ChatMessage>) => {
    if (!userRef.current || !userRef.current._id) return;
    if (!sentMessage.text && !sentMessage.paymentInfo && !sentMessage.paymentLink) return;

    const userId = userRef.current._id.toString();

    // Optimistic update
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}` as any,
      timestamp: new Date(),
      read: true,
      readByAdmin: false,
      sender: sentMessage.sender || 'user',
      text: sentMessage.text || '',
      ...sentMessage,
    };
    
    setUser(prevUser => {
      if (!prevUser) return null;
      const newMessages = [...(prevUser.chatMessages || []), tempMessage];
      return { ...prevUser, chatMessages: newMessages };
    });

    try {
      // Server action
      await sendChatMessage(userId, tempMessage);
      
      // Re-fetch user data to get the real message from server and AI response
      const latestUserData = await getUserById(userId);
      if (latestUserData) {
          latestUserData.chatMessages = latestUserData.chatMessages || [];
          setUser(latestUserData);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить сообщение.' });
      // Revert optimistic update on failure
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          chatMessages: prevUser.chatMessages?.filter(m => m.id !== tempMessage.id),
        }
      });
    }
  }, [toast]);


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
    unreadChatMessages,
    handleNewChatMessage,
  };
}

    
