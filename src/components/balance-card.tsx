'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { Button } from './ui/button';

interface BalanceCardProps {
  balance: number;
  pnl: number;
  onWithdraw: () => void;
}

export function BalanceCard({ balance, pnl, onWithdraw }: BalanceCardProps) {
  const [isUpdated, setIsUpdated] = useState(false);
  const prevBalanceRef = useRef(balance);
  const { t } = useI18n();

  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      setIsUpdated(true);
      const timer = setTimeout(() => setIsUpdated(false), 500);
      prevBalanceRef.current = balance;
      return () => clearTimeout(timer);
    }
  }, [balance]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-6 h-6" />
          <span>{t('accountBalance')}</span>
        </CardTitle>
        <CardDescription>{t('accountBalanceDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className={cn(
            "text-4xl font-bold font-headline transition-transform duration-500",
            isUpdated && (balance > prevBalanceRef.current ? 'text-success' : 'text-destructive'),
          )}
        >
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">{t('totalPnl')}</span>
             <div className={cn(
              'flex items-center text-lg font-medium',
              pnl >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {pnl >= 0 ? 
                <TrendingUp className="mr-2 h-5 w-5" /> : 
                <TrendingDown className="mr-2 h-5 w-5" />
              }
              <span>
                {pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
        </div>
        <Button onClick={onWithdraw} className="w-full">
          <DollarSign className="mr-2 h-4 w-4" />
          {t('withdrawFunds')}
        </Button>
      </CardContent>
    </Card>
  );
}
