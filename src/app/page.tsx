
'use client';
import React from 'react';
import { useTradeSimulator } from '@/hooks/use-trade-simulator';
import { BalanceCard } from '@/components/balance-card';
import { RobotSelection } from '@/components/robot-selection';
import { TradeHistory } from '@/components/trade-history';
import { Bot, RotateCcw, PartyPopper, CandlestickChart, BrainCircuit, PlayCircle, CheckCircle, Hourglass, Trophy, Repeat, LoaderCircle, WifiOff, MessageSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n, I18nProvider } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Chat } from '@/components/chat';


const TradePageContent = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [isChatVisible, setIsChatVisible] = useState(false);

  const { 
    accountId,
    balance, 
    trades, 
    isRunning, 
    selectedRobot, 
    totalPnl,
    totalTradingTime,
    timeLimitReached,
    timeLimit,
    isBlocked,
    chatMessages,
    unreadChatMessages,
    handleSelectRobot, 
    handleToggleSimulator,
    resetSimulator,
    tutorialCompleted,
    completeTutorial,
    isLoading,
    handleNewChatMessage,
  } = useTradeSimulator({isChatOpen: isChatVisible});

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    setIsTutorialOpen(tutorialCompleted === false);
  }, [tutorialCompleted]);

  const tutorialSteps = [
    { icon: PartyPopper, title: t('tutorial.step1.title'), content: t('tutorial.step1.content') },
    { icon: CandlestickChart, title: t('tutorial.step2.title'), content: t('tutorial.step2.content') },
    { icon: BrainCircuit, title: t('tutorial.step3.title'), content: t('tutorial.step3.content') },
    { icon: Bot, title: t('tutorial.step4.title'), content: t('tutorial.step4.content') },
    { icon: PlayCircle, title: t('tutorial.step5.title'), content: t('tutorial.step5.content') },
    { icon: Hourglass, title: t('tutorial.step6.title'), content: t('tutorial.step6.content') },
    { icon: CheckCircle, title: t('tutorial.step7.title'), content: t('tutorial.step7.content') },
  ];

  const handleTutorialClose = () => {
    setIsTutorialOpen(false);
    completeTutorial();
    setTutorialStep(0);
  };

  const handleWithdraw = () => {
    toast({
      titleKey: 'withdrawTitle',
      descriptionKey: 'withdrawDescription',
      duration: 10000,
    });
  };

  const handleResetConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (resetPassword === '1111') {
      resetSimulator();
    } else if (resetPassword === '0001') {
      resetSimulator('demo');
    } else {
      e.preventDefault();
      toast({ variant: 'destructive', titleKey: 'incorrectPassword' });
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <LoaderCircle className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (isBlocked) {
      return (
          <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
              <WifiOff className="h-16 w-16 text-muted-foreground/50" />
              <h2 className="mt-4 text-xl font-semibold text-muted-foreground">Network connection issue</h2>
              <p className="mt-2 text-sm text-muted-foreground">Please check your internet connection and try again.</p>
              <LoaderCircle className="mt-8 h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (timeLimitReached) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 text-center overflow-y-auto">
          <div className="w-full max-w-md mx-auto space-y-6">
            
            <div className="space-y-4">
              <Trophy className="w-16 h-16 text-primary mx-auto" />
              <h1 className="text-3xl font-headline text-primary">{t('timeLimitReachedTitle')}</h1>
              <p className="text-base text-muted-foreground max-w-lg mx-auto">
                {t('timeLimitReachedDesc')}
              </p>
            </div>

            <Card className="w-full text-center shadow-lg bg-card border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('finalResultTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  'text-5xl font-bold font-headline',
                  totalPnl >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => setIsChatVisible(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('chatWithSupport')}
              </Button>
              <AlertDialog onOpenChange={(isOpen) => !isOpen && setResetPassword('')}>
                <AlertDialogTrigger asChild>
                  <Button variant="link">
                    <Repeat className="mr-2 h-4 w-4" />
                    {t('resetSession')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('resetDialogTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('resetDialogDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('resetDialogPasswordPrompt')}
                    </p>
                    <Input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="****"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('resetDialogCancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetConfirm}>{t('resetDialogConfirm')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        {isChatVisible && accountId && (
            <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
                <Chat 
                    userId={accountId}
                    messages={chatMessages}
                    sender="user"
                    onClose={() => setIsChatVisible(false)}
                    onNewMessage={handleNewChatMessage}
                    title={t('chatWithSupport')}
                />
            </div>
        )}
      </>
    );
  }

  return (
    <>
      <Dialog open={isTutorialOpen}>
        <DialogContent
          className="sm:max-w-md"
          hideCloseButton
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
           <DialogHeader>
            <div className="flex flex-col items-center text-center gap-4">
              {tutorialSteps[tutorialStep].icon &&
                React.createElement(tutorialSteps[tutorialStep].icon, {
                  className: "w-12 h-12 text-primary",
                })}
              <DialogTitle className="text-2xl">{tutorialSteps[tutorialStep].title}</DialogTitle>
            </div>
          </DialogHeader>
          <DialogDescription className="text-center text-base px-4">
            {tutorialSteps[tutorialStep].content}
          </DialogDescription>
          
          {tutorialStep === 0 && (
            <div className="flex justify-center py-4">
              <LanguageSwitcher />
            </div>
          )}

          <DialogFooter className="!justify-between !items-center !flex-row pt-4">
              <div>
                {tutorialStep > 0 ? (
                  <Button variant="outline" onClick={() => setTutorialStep(tutorialStep - 1)}>
                    {t('tutorial.previous')}
                  </Button>
                ) : <div style={{width: '90px'}} /> /* Spacer */}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {tutorialStep + 1} / {tutorialSteps.length}
              </div>
              <div>
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <Button onClick={() => setTutorialStep(tutorialStep + 1)}>
                    {t('tutorial.next')}
                  </Button>
                ) : (
                  <Button onClick={handleTutorialClose}>
                    {t('tutorial.finish')}
                  </Button>
                )}
              </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="logo" width={40} height={40} className="text-primary" />
                <h1 className="text-3xl md:text-4xl font-headline text-primary">{t('appName')}</h1>
              </div>
              <p className="text-muted-foreground sm:ml-[52px]">
                {t('appDescription')}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
              <LanguageSwitcher />
              <Button asChild variant="outline" size="icon" aria-label={t('info.title')}>
                <Link href="/info">
                  <Info className="h-4 w-4" />
                </Link>
              </Button>
              <AlertDialog onOpenChange={(isOpen) => !isOpen && setResetPassword('')}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" aria-label={t('resetSession')}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('resetDialogTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('resetDialogDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('resetDialogPasswordPrompt')}
                    </p>
                    <Input
                      type="password"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="****"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('resetDialogCancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetConfirm}>{t('resetDialogConfirm')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </header>
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
              <BalanceCard accountId={accountId} balance={balance} pnl={totalPnl} onWithdraw={handleWithdraw} />
              <RobotSelection
                selectedRobot={selectedRobot}
                onSelect={handleSelectRobot}
                isRunning={isRunning}
                onToggle={handleToggleSimulator}
                totalTradingTime={totalTradingTime}
                timeLimitReached={timeLimitReached}
                timeLimit={timeLimit}
              />
            </div>
            <div className="lg:col-span-2">
              <TradeHistory trades={trades} isRunning={isRunning} />
            </div>
          </main>
        </div>
      </div>
       <div className="fixed bottom-6 right-6 z-50">
          <Button size="icon" className="rounded-full w-16 h-16 shadow-lg relative" onClick={() => setIsChatVisible(true)}>
              <MessageSquare className="w-8 h-8" />
              {unreadChatMessages > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                      {unreadChatMessages}
                  </span>
              )}
          </Button>
      </div>

      {isChatVisible && accountId && (
           <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
              <Chat 
                  userId={accountId}
                  messages={chatMessages}
                  sender="user"
                  onClose={() => setIsChatVisible(false)}
                  onNewMessage={handleNewChatMessage}
                  title={t('chatWithSupport')}
              />
          </div>
      )}
    </>
  );
}


export default function HomePage() {
    return (
        <I18nProvider>
            <TradePageContent />
        </I18nProvider>
    )
}
