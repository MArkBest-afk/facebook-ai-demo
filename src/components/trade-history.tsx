'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Trade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { History, LoaderCircle } from 'lucide-react';
import { useI18n } from "@/hooks/use-i18n";

interface TradeHistoryProps {
  trades: Trade[];
  isRunning: boolean;
}

export function TradeHistory({ trades, isRunning }: TradeHistoryProps) {
  const { t } = useI18n();

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <History className="w-6 h-6" />
            <span>{t('tradeHistory')}</span>
        </CardTitle>
        <CardDescription>{t('tradeHistoryDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="whitespace-nowrap">{t('tableTime')}</TableHead>
              <TableHead className="whitespace-nowrap">{t('tableSymbol')}</TableHead>
              <TableHead className="whitespace-nowrap">{t('tableType')}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t('tableQuantity')}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t('tableTradeAmount')}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t('tableReturn')}</TableHead>
              <TableHead className="text-right whitespace-nowrap">{t('tablePL')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 && !isRunning ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                  {t('noTrades')}
                </TableCell>
              </TableRow>
            ) : (
              <>
                {isRunning && (
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableCell colSpan={7} className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span>{t('searchingForTrades')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {trades.map((trade, index) => (
                  <TableRow key={trade.id} className={cn(index === 0 && trades.length > 0 && "new-trade-animation")}>
                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap">{new Date(trade.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell className="whitespace-nowrap">{trade.symbol}</TableCell>
                    <TableCell
                      className={cn(trade.type === 'BUY' ? 'text-success' : 'text-destructive', 'whitespace-nowrap')}
                    >
                      {trade.type}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{trade.quantity}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">${(trade.entryPrice * trade.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">${(trade.exitPrice * trade.quantity).toFixed(2)}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-bold',
                        trade.pnl >= 0 ? 'text-success' : 'text-destructive',
                        'whitespace-nowrap'
                      )}
                    >
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
