'use client';
import { useTradeSimulator } from '@/hooks/use-trade-simulator';
import { BalanceCard } from '@/components/balance-card';
import { RobotSelection } from '@/components/robot-selection';
import { TradeHistory } from '@/components/trade-history';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Bot className="w-10 h-10 text-primary" />
            <h1 className="text-3xl md:text-4xl font-headline text-primary">DemoTrade AI</h1>
          </div>
          <Button variant="outline" onClick={resetSimulator}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Session
          </Button>
        </header>
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <BalanceCard balance={balance} pnl={totalPnl} />
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
  );
}
