export interface LinuxDistroInfo {
  name: string;
  version: string;
  id: string;
  prettyName: string;
}

export interface LinuxSystemInfo {
  platform: string;
  distro: LinuxDistroInfo;
  kernel: string;
  arch: string;
  hostname: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  processUptimeSeconds: number;
  cpu: {
    model: string;
    cores: number;
    speedMHz: number;
    loadAvg: number[];
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usedPercent: number;
    swapTotalBytes?: number;
    swapFreeBytes?: number;
  };
  processMemory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  disk: {
    total: string;
    used: string;
    available: string;
    usePercent: string;
    mountPoint: string;
  };
  networkInterfaces: Array<{
    name: string;
    address: string;
    family: string;
    mac: string;
    internal: boolean;
  }>;
  nodeVersion: string;
  v8Version: string;
  pid: number;
  user: string;
  homeDir: string;
  isContainer: boolean;
  cgroupVersion: string;
}

export interface LinuxProcessItem {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  status: string;
  startTime: string;
  time: string;
  command: string;
}

export interface LinuxFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  permissions: string;
  modifiedTime: string;
}

export interface LinuxDiagnosticResult {
  timestamp: string;
  overallScore: number; // 0 - 100
  status: "OPTIMAL" | "GOOD" | "DEGRADED" | "WARNING";
  tests: {
    cpuComputeMs: number;
    cpuScore: number;
    ramAllocSpeedMbSec: number;
    ramScore: number;
    diskIoWriteSpeedMbSec: number;
    diskScore: number;
    networkLatencyMs: number;
    networkScore: number;
  };
  streamerReadiness: {
    ffmpegInstalled: boolean;
    obsAgentReachable: boolean;
    webrtcSupported: boolean;
    headroomRamMb: number;
    maxRecommendedFps: number;
    recommendedBitrateKbps: number;
  };
  notes: string[];
}

// Pure helper function for formatting byte units
export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
