
"use client";

import type { RawOrderBookData, OrderBookDisplayData } from '@/types/market-pilot';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { useMemo } from 'react';

interface OrderBookDisplayProps {
  data: RawOrderBookData | null;
  isConnected: boolean;
}

const MAX_ROWS = 10; // Max rows to display for asks/bids

const formatNumber = (numStr: string, decimals: number = 2) => {
  const num = parseFloat(numStr);
  return isNaN(num) ? '-' : num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

export function OrderBookDisplay({ data, isConnected }: OrderBookDisplayProps) {
  
  const { asks, bids } = useMemo(() => {
    if (!data) return { asks: [], bids: [] };

    let askCumulativeTotal = 0;
    const processedAsks: OrderBookDisplayData[] = data.asks.slice(0, MAX_ROWS).map(([price, quantity]) => {
      askCumulativeTotal += parseFloat(quantity);
      return {
        price,
        quantity,
        total: askCumulativeTotal.toString(),
      };
    }).reverse(); // Asks are typically shown with lowest price at the bottom, nearest to spread

    let bidCumulativeTotal = 0;
    const processedBids: OrderBookDisplayData[] = data.bids.slice(0, MAX_ROWS).map(([price, quantity]) => {
      bidCumulativeTotal += parseFloat(quantity);
      return {
        price,
        quantity,
        total: bidCumulativeTotal.toString(),
      };
    });

    return { asks: processedAsks, bids: processedBids };
  }, [data]);

  const midPrice = useMemo(() => {
    if (data && data.asks.length > 0 && data.bids.length > 0) {
      const bestAsk = parseFloat(data.asks[0][0]);
      const bestBid = parseFloat(data.bids[0][0]);
      if (!isNaN(bestAsk) && !isNaN(bestBid)) {
        return ((bestAsk + bestBid) / 2).toFixed(2);
      }
    }
    return null;
  }, [data]);

  if (!isConnected && !data) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold">
            <BookOpen className="mr-2 h-5 w-5 text-primary" />
            Order Book ({data?.symbol || "BTC-USDT-SWAP"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Connecting to WebSocket for order book data...</p>
        </CardContent>
      </Card>
    );
  }
  

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          Order Book ({data?.symbol || "BTC-USDT-SWAP"})
          {data?.timestamp && <span className="ml-auto text-xs text-muted-foreground">{new Date(data.timestamp).toLocaleTimeString()}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0 md:p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          <div className="flex flex-col h-full">
            <h3 className="text-center font-medium text-red-500 mb-1 p-2 md:p-0">Asks</h3>
            <ScrollArea className="flex-grow rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Price (USD)</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asks.map((ask, index) => (
                    <TableRow key={index} className="text-xs">
                      <TableCell className="text-right text-red-500 py-1 px-2">{formatNumber(ask.price, 2)}</TableCell>
                      <TableCell className="text-right py-1 px-2">{formatNumber(ask.quantity, 2)}</TableCell>
                      <TableCell className="text-right py-1 px-2">{formatNumber(ask.total, 2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
          
          {midPrice && (
            <div className="hidden md:flex items-center justify-center text-xl font-bold text-foreground py-2 my-auto col-span-2 order-first md:order-none">
              {formatNumber(midPrice,2)} USD
            </div>
          )}

          <div className="flex flex-col h-full">
             <h3 className="text-center font-medium text-green-500 mb-1 p-2 md:p-0">Bids</h3>
            <ScrollArea className="flex-grow rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Price (USD)</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((bid, index) => (
                    <TableRow key={index} className="text-xs">
                      <TableCell className="text-right text-green-500 py-1 px-2">{formatNumber(bid.price, 2)}</TableCell>
                      <TableCell className="text-right py-1 px-2">{formatNumber(bid.quantity, 2)}</TableCell>
                      <TableCell className="text-right py-1 px-2">{formatNumber(bid.total, 2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

