import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocketReconnection } from "./useWebSocketReconnection";

export interface TiktokAuthorizedUser {
  openId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  accessToken: string;
  authorizedAt: string;
}

export type QrAuthStatus = "WAITING_SCAN" | "SCANNED" | "AUTHORIZED" | "EXPIRED" | "REJECTED";

export interface UseTiktokQrAuthListenerOptions {
  pollingIntervalMs?: number;
  autoPoll?: boolean;
  onAuthorized?: (user: TiktokAuthorizedUser, method: string) => void;
}

export function useTiktokQrAuthListener(options: UseTiktokQrAuthListenerOptions = {}) {
  const {
    pollingIntervalMs = 2500,
    autoPoll = true,
    onAuthorized,
  } = options;

  const [status, setStatus] = useState<QrAuthStatus>("WAITING_SCAN");
  const [sessionId, setSessionId] = useState<string>("");
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(60);
  const [authorizedUser, setAuthorizedUser] = useState<TiktokAuthorizedUser | null>(null);
  const [lastNotification, setLastNotification] = useState<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    user?: TiktokAuthorizedUser;
    method?: string;
  } | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(autoPoll);
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [authSuccessToast, setAuthSuccessToast] = useState<boolean>(false);

  const prevStatusRef = useRef<QrAuthStatus>("WAITING_SCAN");
  const onAuthorizedRef = useRef(onAuthorized);
  onAuthorizedRef.current = onAuthorized;

  // Trigger visual notification on change to AUTHORIZED
  const handleAuthorizedTransition = useCallback((user: TiktokAuthorizedUser, method: string = "qr_scan") => {
    setAuthorizedUser(user);
    setStatus("AUTHORIZED");
    setAuthSuccessToast(true);

    const notif = {
      id: Math.random().toString(36).substring(7),
      title: "¡TikTok LIVE Autorizado!",
      message: `Código QR verificado con éxito. Cuenta @${user.username} autorizada mediante ${method === "webhook" ? "Webhook" : "Escaneo QR"}.`,
      timestamp: new Date().toLocaleTimeString(),
      user,
      method,
    };
    setLastNotification(notif);

    if (onAuthorizedRef.current) {
      onAuthorizedRef.current(user, method);
    }
  }, []);

  // 1. Polling mechanism
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/tiktok/qr/status");
      if (!res.ok) return;
      const data = await res.json();

      if (data.ok) {
        setSessionId(data.sessionId || "");
        setTimeRemainingSec(data.timeRemainingSec ?? 0);

        if (data.status !== prevStatusRef.current) {
          const oldStatus = prevStatusRef.current;
          prevStatusRef.current = data.status;
          setStatus(data.status);

          if (data.status === "AUTHORIZED" && oldStatus !== "AUTHORIZED" && data.authorizedUser) {
            handleAuthorizedTransition(data.authorizedUser, data.authMethod || "polling");
          }
        }
      }
    } catch {
      // Ignore background network transient glitches
    }
  }, [handleAuthorizedTransition]);

  // Periodic polling when enabled
  useEffect(() => {
    if (!isPolling) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [isPolling, pollingIntervalMs, fetchStatus]);

  // 2. WebSocket Real-time Listener (Immediate Push without waiting for next poll)
  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.host : "localhost";
  const wsUrl = `${protocol}//${host}/api/brain/ws`;

  useWebSocketReconnection({
    url: wsUrl,
    onMessage: (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "tiktok_qr_authorized" || (msg.type === "tiktok_auth_status" && msg.status === "AUTHORIZED")) {
          prevStatusRef.current = "AUTHORIZED";
          setStatus("AUTHORIZED");
          const user = msg.user || {
            openId: "user_tiktok",
            username: "hectorruiz9992",
            displayName: "Héctor Ruiz Streamer",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            accessToken: "tk_live_token",
            authorizedAt: new Date().toISOString(),
          };
          handleAuthorizedTransition(user, msg.method || "websocket_push");
        } else if (msg.type === "tiktok_qr_scanned") {
          prevStatusRef.current = "SCANNED";
          setStatus("SCANNED");
        } else if (msg.type === "tiktok_qr_generated") {
          prevStatusRef.current = "WAITING_SCAN";
          setStatus("WAITING_SCAN");
          setSessionId(msg.sessionId);
          setTimeRemainingSec(60);
        }
      } catch {
        // Ignore parse error
      }
    },
  });

  // Actions
  const regenerateQr = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/tiktok/qr/generate", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setStatus("WAITING_SCAN");
        prevStatusRef.current = "WAITING_SCAN";
        setSessionId(data.session.sessionId);
        setTimeRemainingSec(data.timeRemainingSec || 60);
      }
    } catch (e) {
      console.warn("Error regenerando QR:", e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const simulateScan = async () => {
    try {
      await fetch("/api/tiktok/qr/scan-detected", { method: "POST" });
      setStatus("SCANNED");
      prevStatusRef.current = "SCANNED";
    } catch (e) {
      console.warn("Error simulando escaneo:", e);
    }
  };

  const simulateAuthorize = async (customUsername: string = "hectorruiz9992") => {
    setIsAuthorizing(true);
    try {
      const res = await fetch("/api/tiktok/qr/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: customUsername,
          displayName: customUsername === "hectorruiz9992" ? "Héctor Ruiz (Streamer Oficial)" : `@${customUsername}`,
          authMethod: "qr_scan",
        }),
      });
      const data = await res.json();
      if (data.ok && data.user) {
        handleAuthorizedTransition(data.user, "qr_scan");
      }
    } catch (e) {
      console.warn("Error simulando autorización:", e);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const testWebhookAuth = async (customUsername: string = "hectorruiz9992") => {
    setIsAuthorizing(true);
    try {
      const res = await fetch("/api/tiktok/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": "19f761b2d5a310038df9b7102f0c70b192694459d06c19c9e5582835fd663e30",
        },
        body: JSON.stringify({
          event: "qr.authorized",
          status: "AUTHORIZED",
          data: {
            username: customUsername,
            display_name: `@${customUsername}`,
            status: "AUTHORIZED",
            auth_timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        // Polling and websocket will update state immediately
        fetchStatus();
      }
    } catch (e) {
      console.warn("Error enviando webhook de prueba:", e);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const dismissToast = () => setAuthSuccessToast(false);

  return {
    status,
    sessionId,
    timeRemainingSec,
    authorizedUser,
    lastNotification,
    isPolling,
    setIsPolling,
    isAuthorizing,
    isRegenerating,
    authSuccessToast,
    dismissToast,
    regenerateQr,
    simulateScan,
    simulateAuthorize,
    testWebhookAuth,
    refreshStatus: fetchStatus,
  };
}
