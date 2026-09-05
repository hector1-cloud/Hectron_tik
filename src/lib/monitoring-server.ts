import os from "os";

export interface AlertPayload {
  level: "info" | "warning" | "error" | "critical";
  message: string;
  source: string;
  details?: any;
}

export interface MonitoringStats {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuLoad: number[];
  totalErrors: number;
  criticalAlerts: number;
  lastAlertSent?: string;
  status: "healthy" | "degraded" | "critical";
}

class MonitoringService {
  private startTime: number;
  private errorCount: number = 0;
  private criticalCount: number = 0;
  private lastAlertTimestamp?: string;
  private customWebhookUrl: string = process.env.MONITORING_WEBHOOK_URL || "";
  private errorsLog: any[] = [];

  constructor() {
    this.startTime = Date.now();
    this.setupGlobalHandlers();
  }

  public setWebhookUrl(url: string) {
    this.customWebhookUrl = url;
  }
  
  public getWebhookUrl() {
    return this.customWebhookUrl;
  }

  public getStats(): MonitoringStats {
    const mem = process.memoryUsage();
    
    let status: "healthy" | "degraded" | "critical" = "healthy";
    if (this.criticalCount > 0 || this.errorCount > 100) status = "critical";
    else if (this.errorCount > 20) status = "degraded";

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memoryUsage: mem,
      cpuLoad: os.loadavg(),
      totalErrors: this.errorCount,
      criticalAlerts: this.criticalCount,
      lastAlertSent: this.lastAlertTimestamp,
      status
    };
  }
  
  public getRecentErrors() {
    return this.errorsLog.slice(-50);
  }

  public async triggerAlert(payload: AlertPayload) {
    const timestamp = new Date().toISOString();
    
    if (payload.level === "error") this.errorCount++;
    if (payload.level === "critical") {
      this.errorCount++;
      this.criticalCount++;
    }

    if (payload.level === "error" || payload.level === "critical") {
      this.errorsLog.push({ ...payload, timestamp });
      if (this.errorsLog.length > 100) this.errorsLog.shift();
    }

    console.log(`[MONITORING - ${payload.level.toUpperCase()}] ${payload.message}`, payload.details || "");

    if (this.customWebhookUrl && (payload.level === "error" || payload.level === "critical")) {
      try {
        await fetch(this.customWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: `*${payload.level.toUpperCase()} Alert - HectronAutonomo*\n**Message:** ${payload.message}\n**Source:** ${payload.source}\n**Time:** ${timestamp}`,
            payload
          })
        });
        this.lastAlertTimestamp = timestamp;
      } catch (err) {
        console.error("[MONITORING] Failed to deliver webhook alert:", err);
      }
    }
  }

  private setupGlobalHandlers() {
    process.on("uncaughtException", (err) => {
      this.triggerAlert({
        level: "critical",
        message: `Uncaught Exception: ${err.message}`,
        source: "process",
        details: { stack: err.stack }
      });
    });

    process.on("unhandledRejection", (reason, promise) => {
      this.triggerAlert({
        level: "error",
        message: `Unhandled Rejection: ${String(reason)}`,
        source: "process",
        details: { reason }
      });
    });
  }
}

export const monitoringSystem = new MonitoringService();