import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProcessedReading, CurrentReading } from '../types';

interface WebSocketMessage {
  type: 'temperature_reading' | 'processed_reading';
  payload: any;
}

export function useTemperatureWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentReading, setCurrentReading] = useState<CurrentReading | null>(null);
  const [recentReadings, setRecentReadings] = useState<ProcessedReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const readingsMapRef = useRef<Map<string, ProcessedReading>>(new Map());

  const connectWebSocket = useCallback(() => {
    try {
      // Create WebSocket URL with API key as query parameter
      const wsUrl = `${import.meta.env.VITE_WEBSOCKET_URL}?apiKey=${import.meta.env.VITE_API_KEY}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onclose = (event) => {
        console.log('WebSocket Disconnected', event.code, event.reason);
        setIsConnected(false);
        // Only attempt to reconnect if it wasn't a clean close
        if (event.code !== 1000) {
          setTimeout(connectWebSocket, 5000);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket Error:', event);
        setError('Failed to connect to the server');
        setIsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'temperature_reading': {
              // Store the initial reading
              const reading = message.payload;
              const newReading: ProcessedReading = {
                id: reading.id,
                temperature: reading.temperature,
                timestamp: reading.timestamp,
                status: 'NORMAL',
                processedAt: new Date().toISOString(),
              };
              readingsMapRef.current.set(reading.id, newReading);
              break;
            }

            case 'processed_reading': {
              // Update the reading with processed information
              const processedReading = message.payload;
              const existingReading = readingsMapRef.current.get(processedReading.id);

              if (existingReading) {
                const updatedReading: ProcessedReading = {
                  ...existingReading,
                  status: processedReading.status,
                  processedAt: processedReading.processedAt,
                };

                readingsMapRef.current.set(processedReading.id, updatedReading);

                // Update current reading
                setCurrentReading({
                  id: updatedReading.id,
                  temperature: updatedReading.temperature,
                  status: updatedReading.status,
                  lastUpdated: updatedReading.processedAt,
                });

                // Update recent readings (keep only last 5)
                const readings = Array.from(readingsMapRef.current.values());
                const sortedReadings = readings
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 5);

                setRecentReadings(sortedReadings);
              }
              break;
            }
          }
        } catch (err) {
          console.error('Error processing message:', err);
          setError('Failed to process server message');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to connect to the server');
    }
  }, []);

  // Connect on mount and cleanup on unmount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [connectWebSocket]);

  // Add a reconnection handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
        connectWebSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectWebSocket]);

  return {
    isConnected,
    currentReading,
    recentReadings,
    error,
  };
}
