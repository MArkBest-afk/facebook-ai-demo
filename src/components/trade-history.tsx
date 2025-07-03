'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Trade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { History } from 'lucide-react';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <History className="w-6 h-6" />
            <span>Trade History</span>
        </CardTitle>
        <CardDescription>A log of all executed trades.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="whitespace-nowrap">Time</TableHead>
              <TableHead className="whitespace-nowrap">Symbol</TableHead>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="text-right whitespace-nowrap">Quantity</TableHead>
              <TableHead className="text-right whitespace-nowrap">Entry</TableHead>
              <TableHead className="text-right whitespace-nowrap">Exit</TableHead>
              <TableHead className="text-right whitespace-nowrap">P/L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                  No trades yet. Start the robot to see trading activity.
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade, index) => (
                <TableRow key={trade.id} className={cn(index === 0 && trades.length > 0 && "new-trade-animation")}>
                  <TableCell className="font-medium text-muted-foreground whitespace-nowrap">{trade.timestamp.toLocaleTimeString()}</TableCell>
                  <TableCell className="whitespace-nowrap">{trade.symbol}</TableCell>
                  <TableCell
                    className={cn(trade.type === 'BUY' ? 'text-success' : 'text-destructive', 'whitespace-nowrap')}
                  >
                    {trade.type}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">{trade.quantity}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">${trade.entryPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">${trade.exitPrice.toFixed(2)}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
