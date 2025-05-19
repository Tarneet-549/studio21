import type { RawOrderBookData } from '@/types/market-pilot';
import { useEffect, useState, useRef } from 'react';

const WEBSOCKET_URL = 'wss://ws.gomarket-cpp.goquant.io/ws/l2-orderbook/okx/BTC-USDT-SWAP';

export function useWebSocket() {
  const [orderBookData, setOrderBookData] = useState<RawOrderBookData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      return;
    }

    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as RawOrderBookData;
        setOrderBookData(data);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
        setError('Failed to parse market data.');
      }
    };

    ws.current.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError('WebSocket connection error.');
      setIsConnected(false);
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Attempt to reconnect after a delay
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 5000); // Reconnect after 5 seconds
      }
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  return { orderBookData, isConnected, error };
}
