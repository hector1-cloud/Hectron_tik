import { useState, useRef, useEffect } from "react";
import {
  KeyRound,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Sliders,
  Play,
  Square,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Activity,
  Globe
} from "lucide-react";

interface AttemptLog {
  attempt: number;
  timestamp: string;
  status: "pending" | "waiting" | "success" | "failed";
  delayMs?: number;
  error?: string;
  responseNote?: string;
}

export function TiktokTokenExchange() {
  const [authCode, setAuthCode] = useState<string>("code_demo_tiktok_default_2026");
  const [maxRetries, setMaxRetries] = useState<number>(4);
  const [baseDelayMs, setBaseDelayMs] = useState<number>(1500); // 1.5 seconds base
  const [simulateErrors, setSimulateErrors] = useState<boolean>(false);

  // Revoke state
  const [tokenToRevoke, setTokenToRevoke] = useState<string>("");
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [revokeResult, setRevokeResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const EULERSTREAM_OAUTH = {
    authorize: "https://www.eulerstream.com/tiktok/oauth/authorize",
    token: "https://tiktok.eulerstream.com/tiktok/oauth/token",
    revoke: "https://tiktok.eulerstream.com/tiktok/oauth/revoke"
  };

  const handleRevokeToken = async () => {
    setIsRevoking(true);
    setRevokeResult(null);
    try {
      const res = await fetch("/api/tiktok/revoke-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToRevoke })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setRevokeResult({
          success: true,
          message: data.message || "Token revocado exitosamente a través de EulerStream OAuth.",
          details: data.data
        });
      } else {
        setRevokeResult({
          success: false,
          message: data.error || "No se pudo revocar el token.",
          details: data
        });
      }
    } catch (err: any) {
      setRevokeResult({
        success: false,
        message: `Error al conectar con la API de revocación: ${err?.message || "Error de red"}`
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Verification code detection
  const isVerificationCode = authCode.includes("tiktok-developers-site-verification") || 
                             authCode === "il5ZAosOEklehdHHP9lwO2rxTPQ1qwod" ||
                             authCode === "58o0bO0w67EDeqScw66ZzU4OoMCxGZel";

  // Execution State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [statusStage, setStatusStage] = useState<"idle" | "exchanging" | "waiting_backoff" | "success" | "failed">("idle");
  const [logs, setLogs] = useState<AttemptLog[]>([]);

  // Progress Bar State for Backoff Timer
  const [waitProgress, setWaitProgress] = useState<number>(0); // 0 to 100%
  const [remainingTimeSec, setRemainingTimeSec] = useState<number>(0);
  const [currentDelayMs, setCurrentDelayMs] = useState<number>(0);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const abortControllerRef = useRef<boolean>(false);

  // Clean up on unmount to prevent memory leaks with setInterval/Promises
  useEffect(() => {
    return () => {
      abortControllerRef.current = true;
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Smooth Countdown Timer with Progress Bar Animation
  const sleepWithProgress = (durationMs: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      setCurrentDelayMs(durationMs);
      setWaitProgress(0);

      const interval = setInterval(() => {
        // Stop if aborted manually
        if (abortControllerRef.current) {
          clearInterval(interval);
          resolve(false);
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / durationMs) * 100);
        const remaining = Math.max(0, (durationMs - elapsed) / 1000);

        setWaitProgress(progress);
        setRemainingTimeSec(parseFloat(remaining.toFixed(1)));

        if (elapsed >= durationMs) {
          clearInterval(interval);
          setWaitProgress(100);
          setRemainingTimeSec(0);
          resolve(true); // Completed delay
        }
      }, 40); // 25fps smooth progress bar updates
      
      // Cleanup interval on unmount will be hard here unless we store intervalId in a ref,
      // but abortControllerRef usually handles cancellation if component cancels properly.
    });
  };

  const cancelExchange = () => {
    abortControllerRef.current = true;
    setIsRunning(false);
    setStatusStage("failed");
    setLogs((prev) => [
      ...prev,
      {
        attempt: currentAttempt,
        timestamp: new Date().toLocaleTimeString(),
        status: "failed",
        error: "Cancelado manualmente por el usuario."
      }
    ]);
  };

  const runTokenExchangeWithExponentialBackoff = async () => {
    if (!authCode.trim()) return;

    abortControllerRef.current = false;
    if (isVerificationCode) {
      setLogs([{
        attempt: 0,
        timestamp: new Date().toLocaleTimeString(),
        status: "failed",
        error: "No se puede iniciar el intercambio: Se detectó un código de verificación DNS en lugar de un Authorization Code."
      }]);
      return;
    }

    setIsRunning(true);
    setLogs([]);
    setCurrentAttempt(0);
    setWaitProgress(0);
    setRemainingTimeSec(0);
    setStatusStage("exchanging");

    let attempt = 0;
    let success = false;

    while (attempt < maxRetries && !success && !abortControllerRef.current) {
      attempt++;
      setCurrentAttempt(attempt);
      setStatusStage("exchanging");

      const attemptTimestamp = new Date().toLocaleTimeString();

      setLogs((prev) => [
        ...prev,
        {
          attempt,
          timestamp: attemptTimestamp,
          status: "pending",
          responseNote: `Iniciando petición de intercambio de token a TikTok API...`
        }
      ]);

      try {
        // Send token exchange request to server endpoint
        const response = await fetch("/api/tiktok/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: authCode,
            attempt,
            simulateError: simulateErrors && attempt < maxRetries // Simulate transient errors on earlier attempts if enabled
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          success = true;
          setStatusStage("success");
          setLogs((prev) =>
            prev.map((log) =>
              log.attempt === attempt
                ? {
                    ...log,
                    status: "success",
                    responseNote: `Token obtenido exitosamente: ${data.access_token ? `${data.access_token.substring(0, 12)}...` : "token_valid_session"}`
                  }
                : log
            )
          );
          setIsRunning(false);
          return;
        } else {
          // Attempt failed (rate limit, network glitch, or simulated transient error)
          const errorMessage = data.error || data.message || "Error al intercambiar código de autorización.";

          if (attempt < maxRetries && !abortControllerRef.current) {
            // Calculate Exponential Backoff Delay: delay = baseDelay * 2^(attempt - 1)
            const backoffDelay = baseDelayMs * Math.pow(2, attempt - 1);

            setLogs((prev) =>
              prev.map((log) =>
                log.attempt === attempt
                  ? {
                      ...log,
                      status: "waiting",
                      delayMs: backoffDelay,
                      error: `${errorMessage}. Iniciando Backoff Exponencial...`
                    }
                  : log
              )
            );

            setStatusStage("waiting_backoff");

            // Wait with animated visual progress bar
            const completed = await sleepWithProgress(backoffDelay);
            if (!completed) return; // Cancelled
          } else {
            // Max retries reached
            setLogs((prev) =>
              prev.map((log) =>
                log.attempt === attempt
                  ? {
                      ...log,
                      status: "failed",
                      error: `Máximo de reintentos alcanzado (${maxRetries}). Error final: ${errorMessage}`
                    }
                  : log
              )
            );
            setStatusStage("failed");
          }
        }
      } catch (err: any) {
        const fetchErrorMsg = err?.message || "Error de conexión de red.";

        if (attempt < maxRetries && !abortControllerRef.current) {
          const backoffDelay = baseDelayMs * Math.pow(2, attempt - 1);

          setLogs((prev) =>
            prev.map((log) =>
              log.attempt === attempt
                ? {
                    ...log,
                    status: "waiting",
                    delayMs: backoffDelay,
                    error: `${fetchErrorMsg}. Reintentando con Backoff...`
                  }
                : log
            )
          );

          setStatusStage("waiting_backoff");
          const completed = await sleepWithProgress(backoffDelay);
          if (!completed) return;
        } else {
          setLogs((prev) =>
            prev.map((log) =>
              log.attempt === attempt
                ? {
                    ...log,
                    status: "failed",
                    error: `Fallo tras ${maxRetries} intentos: ${fetchErrorMsg}`
                  }
                : log
            )
          );
          setStatusStage("failed");
        }
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Intercambio de Token TikTok (Exponencial Backoff Retry Engine)</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                OAuth 2.0
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Intercambia el <code className="text-cyan-300 font-mono text-[11px]">authorization_code</code> por un <code className="text-cyan-300 font-mono text-[11px]">access_token</code> oficial con tolerancia a fallos de red y límites de velocidad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={cancelExchange}
              className="px-3.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Cancelar</span>
            </button>
          ) : (
            <button
              onClick={runTokenExchangeWithExponentialBackoff}
              disabled={isVerificationCode}
              className={`px-4 py-2 font-bold rounded-lg text-xs transition flex items-center gap-2 shadow-lg ${
                isVerificationCode 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-cyan-500/20"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ejecutar Intercambio con Reintentos</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Auth Code Input */}
        <div className="md:col-span-1 bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Authorization Code</span>
            </span>
          </label>
          <input
            type="text"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value.trim())}
            disabled={isRunning}
            placeholder="ej. code_tiktok_oauth_123"
            className={`w-full bg-slate-900 border ${isVerificationCode ? 'border-amber-500/50 focus:border-amber-500' : 'border-slate-800 focus:border-cyan-400'} rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition disabled:opacity-50`}
          />
          {isVerificationCode && (
            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200 leading-tight">
                <strong>Atención:</strong> Parece que has ingresado un código de verificación DNS. Para este paso, necesitas un <strong>Authorization Code</strong> obtenido tras el login de TikTok.
              </p>
            </div>
          )}
        </div>

        {/* Backoff Parameters */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Máximo de Reintentos</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300">{maxRetries} reintentos</span>
          </div>
          <input
            type="range"
            min={2}
            max={6}
            value={maxRetries}
            onChange={(e) => setMaxRetries(Number(e.target.value))}
            disabled={isRunning}
            className="w-full accent-cyan-400 cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>2 intentos</span>
            <span>6 intentos</span>
          </div>
        </div>

        {/* Base Delay */}
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Retardo Base ($T_0$)</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300">{(baseDelayMs / 1000).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={500}
            max={3000}
            step={250}
            value={baseDelayMs}
            onChange={(e) => setBaseDelayMs(Number(e.target.value))}
            disabled={isRunning}
            className="w-full accent-cyan-400 cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.5s</span>
            <span>3.0s</span>
          </div>
        </div>
      </div>

      {/* Simulation Toggle */}
      <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300 font-medium">Modo Simulación de Errores Transitorios (429 Rate Limit / Glitch)</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={simulateErrors}
            onChange={(e) => setSimulateErrors(e.target.checked)}
            disabled={isRunning}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
        </label>
      </div>

      {/* VISUAL EXPONENTIAL BACKOFF PROGRESS BAR (Active during retries) */}
      {(statusStage === "waiting_backoff" || isRunning) && (
        <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-3 animate-fadeIn shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-cyan-300">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>
                {statusStage === "waiting_backoff"
                  ? `Esperando Backoff Exponencial (Reintento ${currentAttempt} de ${maxRetries})...`
                  : `Procesando petición en TikTok API (Intento ${currentAttempt} de ${maxRetries})...`}
              </span>
            </div>
            {statusStage === "waiting_backoff" && (
              <span className="font-mono font-bold text-white text-xs bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                ⏳ Reintento en <strong className="text-cyan-400">{remainingTimeSec.toFixed(1)}s</strong>
              </span>
            )}
          </div>

          {/* Animated Smooth Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 relative">
              <div
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${statusStage === "waiting_backoff" ? waitProgress : 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Retardo Calculado: {((baseDelayMs * Math.pow(2, Math.max(0, currentAttempt - 1))) / 1000).toFixed(1)}s ($T_{currentAttempt} = T_0 \times 2^{currentAttempt-1}$)</span>
              <span>{Math.round(waitProgress)}% Completado</span>
            </div>
          </div>
        </div>
      )}

      {/* Attempt History Timeline & Logs */}
      {logs.length > 0 && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden space-y-0">
          <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Línea de Tiempo del Intercambio de Token</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Intento {currentAttempt} / {maxRetries}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {logs.map((log) => (
              <div key={log.attempt} className="p-3.5 hover:bg-slate-900/40 transition space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {log.status === "pending" && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
                    {log.status === "waiting" && <Clock className="w-4 h-4 text-amber-400 animate-pulse" />}
                    {log.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {log.status === "failed" && <XCircle className="w-4 h-4 text-red-400" />}

                    <span className="text-white">Intento #{log.attempt}</span>
                    <span className="text-[10px] text-slate-500 font-mono font-normal">{log.timestamp}</span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      log.status === "success"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                        : log.status === "failed"
                        ? "bg-red-950 text-red-400 border border-red-500/30"
                        : log.status === "waiting"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/30"
                        : "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {log.status === "success"
                      ? "200 OK Token Exitoso"
                      : log.status === "waiting"
                      ? "Retardo Exponencial"
                      : log.status === "failed"
                      ? "Fallo Final"
                      : "Enviando"}
                  </span>
                </div>

                {log.error && (
                  <div className="bg-amber-950/30 border border-amber-500/20 p-2 rounded text-[11px] text-amber-300 font-mono">
                    ⚠️ {log.error}
                  </div>
                )}

                {log.responseNote && (
                  <div className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                    {log.responseNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EulerStream OAuth Endpoints Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Puntos Finales de OAuth EulerStream (TikTok Developers)</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                  Integrados
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">Endpoints configurados para autorización, intercambio de tokens y revocación.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* 1. Authorize Endpoint */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>1. Iniciar Flujo de Autorización (Authorize URL)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(EULERSTREAM_OAUTH.authorize, "endpoint_auth")}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  {copiedKey === "endpoint_auth" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar</span>
                </button>
                <a
                  href="/api/tiktok/login"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                >
                  <span>Iniciar Login</span>
                </a>
              </div>
            </div>
            <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-cyan-300 border border-slate-800/80 break-all select-all">
              {EULERSTREAM_OAUTH.authorize}
            </div>
          </div>

          {/* 2. Token Exchange Endpoint */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>2. Intercambio de Códigos por Tokens de Acceso (Token URL)</span>
              </span>
              <button
                onClick={() => handleCopy(EULERSTREAM_OAUTH.token, "endpoint_token")}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
              >
                {copiedKey === "endpoint_token" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-emerald-300 border border-slate-800/80 break-all select-all">
              {EULERSTREAM_OAUTH.token}
            </div>
          </div>

          {/* 3. Revoke / Refresh Endpoint */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>3. Revocar Acceso o Refrescar Tokens (Revoke URL)</span>
              </span>
              <button
                onClick={() => handleCopy(EULERSTREAM_OAUTH.revoke, "endpoint_revoke")}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
              >
                {copiedKey === "endpoint_revoke" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="bg-slate-950 p-2 rounded font-mono text-[11px] text-amber-300 border border-slate-800/80 break-all select-all">
              {EULERSTREAM_OAUTH.revoke}
            </div>

            {/* Interactive Revoke Token Input */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block">Probar Revocación de Token:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tokenToRevoke}
                  onChange={(e) => setTokenToRevoke(e.target.value.trim())}
                  placeholder="Introduce access_token o refresh_token para revocar"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-400"
                />
                <button
                  onClick={handleRevokeToken}
                  disabled={isRevoking}
                  className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRevoking ? "animate-spin" : ""}`} />
                  <span>{isRevoking ? "Revocando..." : "Revocar Token"}</span>
                </button>
              </div>

              {revokeResult && (
                <div
                  className={`p-2.5 rounded border text-xs ${
                    revokeResult.success
                      ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                      : "bg-red-950/50 border-red-500/30 text-red-300"
                  }`}
                >
                  <p className="font-bold">{revokeResult.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EulerStream CDN & Webhook Credentials Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" />
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Configuración CDN EulerStream y Webhooks de Alertas</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/30">
                  CORS Activo
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">Parámetros de conexión, origen permitido y secretos para webhooks de alertas.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* CDN Host */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Nombre de Host CDN:</span>
              <button
                onClick={() => handleCopy("7bfqra32uhm6g0zl.assets.cdn.eulerstream.com", "cdn_host")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
              >
                {copiedKey === "cdn_host" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-mono text-white text-[11px] bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
              7bfqra32uhm6g0zl.assets.cdn.eulerstream.com
            </div>
          </div>

          {/* Generated CORS Origin */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Origen de CORS Generado:</span>
              <button
                onClick={() => handleCopy("https://7bfqra32uhm6g0zl.assets.cdn.eulerstream.com", "cors_origin")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
              >
                {copiedKey === "cors_origin" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-mono text-purple-300 text-[11px] bg-slate-950 p-2 rounded border border-purple-900/50 break-all select-all">
              https://7bfqra32uhm6g0zl.assets.cdn.eulerstream.com
            </div>
          </div>

          {/* API Key EulerStream */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">API Key EulerStream:</span>
              <button
                onClick={() => handleCopy("euler_OTVjZTVkZTkwZjhlY2FhZjJmODEzYzY5ZGFiMTBjZTQxNzUyNzBjZjliMWFmZmQ5Njc5MzRm", "euler_api_key")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
              >
                {copiedKey === "euler_api_key" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-mono text-emerald-300 text-[11px] bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
              euler_OTVjZTVkZTkwZjhlY2FhZjJmODEzYzY5ZGFiMTBjZTQxNzUyNzBjZjliMWFmZmQ5Njc5MzRm
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Secreto Webhook Alertas:</span>
              <button
                onClick={() => handleCopy("19f761b2d5a310038df9b7102f0c70b192694459d06c19c9e5582835fd663e30", "webhook_secret")}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
              >
                {copiedKey === "webhook_secret" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <div className="font-mono text-amber-300 text-[11px] bg-slate-950 p-2 rounded border border-slate-800 break-all select-all">
              19f761b2d5a310038df9b7102f0c70b192694459d06c19c9e5582835fd663e30
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Formula Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
        <span className="font-bold text-cyan-300 block">📐 ¿Cómo Funciona la Fórmula de Backoff Exponencial?</span>
        <p className="text-slate-400 leading-relaxed">
          Cuando TikTok API devuelve un límite de peticiones (Rate Limit 429) o una falla temporal de red, la aplicación calcula el tiempo de espera mediante la ecuación:
        </p>
        <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-cyan-200 text-[11px]">
          Delay(n) = BaseDelay × 2^(n-1)
        </div>
        <p className="text-[11px] text-slate-400">
          Esto evita sobrecargar los servidores de TikTok y garantiza una alta tasa de éxito en el intercambio de credenciales.
        </p>
      </div>
    </div>
  );
}
