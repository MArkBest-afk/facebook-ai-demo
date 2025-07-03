'use client';
import { useState, useEffect } from 'react';
import { useTradeSimulator } from '@/hooks/use-trade-simulator';
import { BalanceCard } from '@/components/balance-card';
import { RobotSelection } from '@/components/robot-selection';
import { TradeHistory } from '@/components/trade-history';
import { Bot, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useToast } from '@/hooks/use-toast';
import { TutorialGuide } from '@/components/tutorial-guide';

const TUTORIAL_COMPLETED_KEY = 'hasCompletedTutorial';

export default function Home() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { 
    balance, 
    trades, 
    isRunning, 
    selectedRobot, 
    totalPnl, 
    handleSelectRobot, 
    handleToggleSimulator,
    resetSimulator
  } = useTradeSimulator();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);
      const isNewSession = !localStorage.getItem('tradeSimulatorState');
      if (isNewSession || hasCompleted !== 'true') {
        setShowTutorial(true);
      }
    } catch (error) {
      console.error("Failed to read tutorial completion state", error);
      setShowTutorial(true);
    }
  }, []);

  const handleWithdraw = () => {
    toast({
      titleKey: 'withdrawTitle',
      descriptionKey: 'withdrawDescription',
      duration: 10000,
    });
  };
  
  const handleResetAndTutorial = () => {
    resetSimulator();
    try {
      localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
    } catch (error) {
       console.error("Failed to remove tutorial state from localStorage", error);
    }
    setShowTutorial(true);
  }

  return (
    <>
      <TutorialGuide isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <Bot className="w-10 h-10 text-primary" />
                <h1 className="text-3xl md:text-4xl font-headline text-primary">{t('appName')}</h1>
              </div>
              <p className="text-muted-foreground sm:ml-[56px]">
                {t('appDescription')}
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
              <LanguageSwitcher />
              <Button variant="outline" onClick={handleResetAndTutorial}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('resetSession')}
              </Button>
            </div>
          </header>
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
              <BalanceCard balance={balance} pnl={totalPnl} onWithdraw={handleWithdraw} />
              <RobotSelection
                selectedRobot={selectedRobot}
                onSelect={handleSelectRobot}
                isRunning={isRunning}
                onToggle={handleToggleSimulator}
              />
            </div>
            <div className="lg:col-span-2">
              <TradeHistory trades={trades} />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
