import { useEffect, useRef, useState, useCallback } from 'react';

export type UseWebSocketOptions = {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  maxReconnectAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  connectionTimeoutMs?: number;
};

export function useWebSocketReconnection(options: UseWebSocketOptions) {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    maxReconnectAttempts = 20,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    connectionTimeoutMs = 10000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.warn(`[WebSocket] Timeout de conexión excedido para ${url}`);
          ws.close();
        }
      }, connectionTimeoutMs);

      ws.onopen = (event) => {
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        if (onOpenRef.current) onOpenRef.current(event);
      };

      ws.onmessage = (event) => {
        if (onMessageRef.current) onMessageRef.current(event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        if (onCloseRef.current) onCloseRef.current(event);
        scheduleReconnect();
      };

      ws.onerror = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        if (onErrorRef.current) onErrorRef.current(event);
      };
    } catch (err) {
      setIsConnecting(false);
      scheduleReconnect();
    }
  }, [url, connectionTimeoutMs]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn("[WebSocket] Número máximo de intentos de reconexión alcanzado.");
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(baseDelayMs * Math.pow(2, reconnectAttemptsRef.current), maxDelayMs);
    reconnectAttemptsRef.current += 1;

    console.log(`[WebSocket] Reconectando en ${delay}ms... (Intento ${reconnectAttemptsRef.current})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [baseDelayMs, maxDelayMs, maxReconnectAttempts, connect]);

  useEffect(() => {
    connect();

    return () => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        // Prevent onclose from triggering another reconnect on unmount
        wsRef.current.onclose = null; 
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const forceReconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(); // Triggers onclose -> scheduleReconnect
    } else {
      connect();
    }
  }, [connect]);

  return { isConnected, isConnecting, sendMessage, forceReconnect };
}
