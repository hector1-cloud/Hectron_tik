import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Terminal as TerminalIcon,
  Folder,
  File,
  FileText,
  FileCode,
  HardDrive,
  Cpu,
  Server,
  Play,
  RotateCw,
  Trash2,
  Download,
  Upload,
  Plus,
  Edit3,
  Copy,
  Check,
  Search,
  Sparkles,
  Zap,
  Activity,
  Shield,
  Layers,
  ChevronRight,
  CornerDownLeft,
  Settings,
  AlertCircle,
  HelpCircle,
  Eye,
  Maximize2,
  FolderPlus,
  FilePlus,
} from "lucide-react";
import { formatBytes } from "../lib/linux-types";

export interface MockFileSystemItem {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory" | "symlink";
  size: number;
  permissions: string;
  owner: string;
  group: string;
  modified: string;
  content?: string;
  isExecutable?: boolean;
}

const INITIAL_MOCK_FILESYSTEM: MockFileSystemItem[] = [
  // Root directories
  { id: "dir_root", name: "/", path: "/", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-08-28 00:00" },
  { id: "dir_app", name: "app", path: "/app", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "hectron", group: "hectron", modified: "2026-08-28 01:10" },
  { id: "dir_applet", name: "applet", path: "/app/applet", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "hectron", group: "hectron", modified: "2026-08-28 01:45" },
  { id: "dir_home", name: "home", path: "/home", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-08-28 00:00" },
  { id: "dir_hectron", name: "hectron", path: "/home/hectron", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "hectron", group: "hectron", modified: "2026-08-28 01:00" },
  { id: "dir_etc", name: "etc", path: "/etc", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-08-28 00:00" },
  { id: "dir_var_log", name: "log", path: "/var/log", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-08-28 01:20" },
  { id: "dir_storage", name: "storage", path: "/storage", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "hectron", group: "hectron", modified: "2026-08-28 01:40" },
  { id: "dir_emulated", name: "emulated", path: "/storage/emulated", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "hectron", group: "hectron", modified: "2026-08-28 01:40" },
  { id: "dir_emulated_0", name: "0", path: "/storage/emulated/0", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "hectron", group: "hectron", modified: "2026-08-28 01:40" },
  { id: "dir_hector_android", name: "Hector", path: "/storage/emulated/0/Hector", type: "directory", size: 4096, permissions: "drwxr-xr-x", owner: "hectron", group: "hectron", modified: "2026-08-28 01:48" },

  // Files in /app/applet
  {
    id: "file_package_json",
    name: "package.json",
    path: "/app/applet/package.json",
    type: "file",
    size: 1593,
    permissions: "-rw-r--r--",
    owner: "hectron",
    group: "hectron",
    modified: "2026-08-28 01:42",
    content: `{\n  "name": "hectron-streamer-studio",\n  "version": "38.4.0",\n  "type": "module",\n  "scripts": {\n    "dev": "tsx server.ts",\n    "build": "vite build",\n    "start": "node dist/server.cjs"\n  }\n}`,
  },
  {
    id: "file_requirements_txt",
    name: "requirements.txt",
    path: "/app/applet/requirements.txt",
    type: "file",
    size: 420,
    permissions: "-rw-r--r--",
    owner: "hectron",
    group: "hectron",
    modified: "2026-08-28 01:47",
    content: `fastapi==0.110.0\nuvicorn[standard]==0.28.0\ngoogle-genai==2.4.0\ntorch==2.2.0\ntransformers==4.38.2\nwebsockets==12.0\npydantic==2.6.4\nollama==0.1.7`,
  },
  {
    id: "file_server_ts",
    name: "server.ts",
    path: "/app/applet/server.ts",
    type: "file",
    size: 14820,
    permissions: "-rw-r--r--",
    owner: "hectron",
    group: "hectron",
    modified: "2026-08-28 01:40",
    content: `import express from "express";\nimport { createServer } from "http";\n\nconst app = express();\nconst PORT = 3000;\n\napp.get("/api/health", (req, res) => {\n  res.json({ status: "ok", streamer: "Miku Live Core" });\n});\n\napp.listen(PORT, "0.0.0.0", () => {\n  console.log("Hectron Engine running on port " + PORT);\n});`,
  },
  {
    id: "file_start_sh",
    name: "start.sh",
    path: "/app/applet/start.sh",
    type: "file",
    size: 512,
    permissions: "-rwxr-xr-x",
    owner: "hectron",
    group: "hectron",
    modified: "2026-08-28 01:15",
    isExecutable: true,
    content: `#!/bin/bash\necho "=== [HECTRON LINUX RUNTIME] ==="\necho "Iniciando servidor de streaming en 0.0.0.0:3000..."\nnode dist/server.cjs`,
  },
  {
    id: "file_os_release",
    name: "os-release",
    path: "/etc/os-release",
    type: "file",
    size: 284,
    permissions: "-rw-r--r--",
    owner: "root",
    group: "root",
    modified: "2026-08-28 00:00",
    content: `PRETTY_NAME="Debian GNU/Linux 12 (bookworm) / OCI Linux Container"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"\nVERSION="12 (bookworm)"\nID=debian\nHOME_URL="https://www.debian.org/"`,
  },
  {
    id: "file_streamer_log",
    name: "streamer.log",
    path: "/var/log/streamer.log",
    type: "file",
    size: 8940,
    permissions: "-rw-r--r--",
    owner: "hectron",
    group: "hectron",
    modified: "2026-08-28 01:49",
    content: `[2026-08-28 01:45:10] [INFO] Hectron Streamer Engine v38.4 booted successfully.\n[2026-08-28 01:46:02] [INFO] 3D Miku Avatar loaded with 52 Blendshapes.\n[2026-08-28 01:47:00] [INFO] TTS Gemini Voice pipeline online (Rate: 24kHz).\n[2026-08-28 01:48:30] [INFO] Linux OCI Container Telemetry initialized.`,
  },
  {
    id: "file_android_hector_notes",
    name: "live_config.json",
    path: "/storage/emulated/0/Hector/live_config.json",
    type: "file",
    size: 780,
    permissions: "-rw-rw-r--",
    owner: "hectron",
    group: "hectron",
    modified: "2026-08-28 01:48",
    content: `{\n  "streamerName": "Hector Ruiz (Hectron)",\n  "roomTarget": "@hectron_universe",\n  "autoReply": true,\n  "aiHostMode": "Gemini 3.7 Flash + Live TTS",\n  "obsPort": 4455,\n  "streamPlatform": "TikTok LIVE"\n}`,
  },
];

interface TerminalEntry {
  id: string;
  command: string;
  cwd: string;
  output: string;
  isError?: boolean;
  timestamp: string;
  durationMs: number;
}

export function LinuxVMTab() {
  const [activeSubTab, setActiveSubTab] = useState<"xterm" | "explorer" | "hardware" | "quicktools">("xterm");
  const [currentCwd, setCurrentCwd] = useState<string>("/app/applet");
  const [commandInput, setCommandInput] = useState<string>("");
  const [history, setHistory] = useState<TerminalEntry[]>([
    {
      id: "init_1",
      command: "uname -a && cat /etc/os-release | head -n 3",
      cwd: "/app",
      output: `Linux hectron-streamer-host 6.6.0 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\nPRETTY_NAME="Debian GNU/Linux 12 (bookworm) / OCI Linux Container"\nNAME="Debian GNU/Linux"\nVERSION_ID="12"`,
      timestamp: new Date().toLocaleTimeString(),
      durationMs: 4,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistoryList, setCommandHistoryList] = useState<string[]>([
    "uname -a && cat /etc/os-release | head -n 3",
  ]);

  // Terminal Theme
  const [terminalTheme, setTerminalTheme] = useState<"matrix" | "cyber" | "monokai" | "ubuntu">("cyber");

  // Mock Filesystem State
  const [fileSystem, setFileSystem] = useState<MockFileSystemItem[]>(INITIAL_MOCK_FILESYSTEM);
  const [selectedFile, setSelectedFile] = useState<MockFileSystemItem | null>(null);
  const [isViewingFile, setIsViewingFile] = useState<boolean>(false);
  const [fileContentEdit, setFileContentEdit] = useState<string>("");
  const [newFileName, setNewFileName] = useState<string>("");
  const [isCreatingFileModal, setIsCreatingFileModal] = useState<boolean>(false);
  const [creatingType, setCreatingType] = useState<"file" | "directory">("file");
  const [searchFileQuery, setSearchFileQuery] = useState<string>("");

  // Virtual Installed Packages
  const [virtualPackages, setVirtualPackages] = useState<string[]>([
    "bash",
    "coreutils",
    "nodejs",
    "npm",
    "curl",
    "iproute2",
    "procps",
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeSubTab === "xterm") {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, activeSubTab]);

  // Command Execution Handler with Smart Simulation
  const executeCommand = async (cmdToRun: string) => {
    const rawCmd = cmdToRun.trim();
    if (!rawCmd) return;

    // Add to history list
    setCommandHistoryList((prev) => [...prev, rawCmd]);
    setHistoryIndex(-1);

    const startTime = performance.now();
    let output = "";
    let isError = false;
    const lowerCmd = rawCmd.toLowerCase();

    // 1. Try real server API if available, or simulate standard/extended tools
    if (rawCmd === "clear" || rawCmd === "cls") {
      setHistory([]);
      setCommandInput("");
      return;
    }

    if (rawCmd === "help") {
      output = `=== [HECTRON LINUX VM COMMAND ASSISTANT] ===
Available Commands:
  • Sistema & Info:    uname -a, uptime, whoami, hostname, neofetch, env
  • Paquetes & AI:     sudo apt update, sudo apt install <pkg>, pip install -r requirements.txt, ollama serve, ollama run <model>
  • Archivos & Nav:    ls -la, cd <dir>, pwd, cat <file>, mkdir <dir>, touch <file>, rm <file>
  • Recursos & Red:    free -m, df -h, ps aux, top, ip addr, ping <host>, curl <url>
  • Control Streamer:  start.sh, npm run dev, node --version, python3 --version`;
    } else if (lowerCmd.startsWith("sudo apt install") || lowerCmd.startsWith("apt install") || lowerCmd.startsWith("apt-get install")) {
      const pkgs = rawCmd.split(" ").slice(3).filter((p) => p !== "-y" && p.trim().length > 0);
      const pkgNames = pkgs.join(" ") || "python3 python3-pip";
      setVirtualPackages((prev) => Array.from(new Set([...prev, ...pkgs, "sudo", "apt", "python3", "python3-pip"])));
      output = `[sudo] password for hectron: 
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  ${pkgNames}
0 upgraded, ${pkgs.length || 2} newly installed, 0 to remove and 0 not upgraded.
Need to get 14.2 MB of archives.
After this operation, 48.6 MB of additional disk space will be used.
Get:1 http://deb.debian.org/debian bookworm/main amd64 ${pkgNames} [14.2 MB]
Fetched 14.2 MB in 0.4s (35.5 MB/s)
Selecting previously unselected package ${pkgNames}.
Preparing to unpack .../${pkgNames}.deb ...
Unpacking ${pkgNames} ...
Setting up ${pkgNames} (12.4.0-1) ...
Processing triggers for man-db (2.11.2-2) ...
✓ Instalação finalizada com sucesso! '${pkgNames}' ya está listo en el sistema.`;
    } else if (lowerCmd === "sudo apt update" || lowerCmd === "apt update") {
      output = `Hit:1 http://deb.debian.org/debian bookworm InRelease
Hit:2 http://deb.debian.org/debian-security bookworm-security InRelease
Hit:3 http://deb.debian.org/debian bookworm-updates InRelease
Reading package lists... Done
Building dependency tree... Done
All packages are up to date.`;
    } else if (lowerCmd.startsWith("pip install") || lowerCmd.startsWith("pip3 install")) {
      output = `Collecting fastapi==0.110.0 (from -r requirements.txt)
  Downloading fastapi-0.110.0-py3-none-any.whl (92 kB)
Collecting uvicorn[standard]==0.28.0 (from -r requirements.txt)
  Downloading uvicorn-0.28.0-py3-none-any.whl (60 kB)
Collecting google-genai==2.4.0 (from -r requirements.txt)
  Downloading google_genai-2.4.0-py3-none-any.whl (142 kB)
Collecting ollama==0.1.7 (from -r requirements.txt)
  Downloading ollama-0.1.7-py3-none-any.whl (10 kB)
Installing collected packages: pydantic, starlette, fastapi, uvicorn, google-genai, ollama
Successfully installed fastapi-0.110.0 google-genai-2.4.0 ollama-0.1.7 uvicorn-0.28.0`;
    } else if (lowerCmd.startsWith("ollama serve") || lowerCmd === "ollama") {
      output = `2026/08/28 01:50:40 routes.go:1008: INFO server config env="map[CUDA_VISIBLE_DEVICES: OLLAMA_DEBUG:0 OLLAMA_HOST:0.0.0.0:11434]"
time=2026-08-28T01:50:40.100Z level=INFO source=images.go:733 msg="total blobs: 0"
time=2026-08-28T01:50:40.101Z level=INFO source=server.go:540 msg="llama runner started in background"
[HECTRON OLLAMA ENGINE] Ollama Server escuchando en http://127.0.0.1:11434 (Bridge activo con Gemini 3.7 Flash)`;
    } else if (lowerCmd.startsWith("ollama run")) {
      const model = rawCmd.split(" ")[2] || "llama3";
      output = `pulling manifest 
pulling 00e1317c... 100% ▕████████████████▏ 4.7 GB                         
verifying sha256 digest 
writing manifest 
success 
>>> Conectado con modelo ${model} v1.0
Hectron AI: ¡Hola! Soy el asistente local ${model} integrado en Hectron Linux VM. ¿En qué te puedo ayudar hoy?`;
    } else if (lowerCmd.startsWith("curl") && lowerCmd.includes("ollama.com")) {
      output = `>>> Downloading ollama...
######################################################################## 100.0%
>>> Installing ollama to /usr/local/bin...
>>> Creating ollama user...
>>> Creating ollama systemd service...
>>> Adding current user hectron to ollama group...
>>> The Ollama API is now available at 127.0.0.1:11434.
>>> Install complete. Run "ollama run llama3" to start.`;
    } else if (rawCmd === "cd /storage/emulated/0/Hector" || rawCmd === "cd /storage/emulated/0" || rawCmd.startsWith("cd ")) {
      const targetPath = rawCmd.replace("cd", "").trim();
      let newPath = targetPath;
      if (targetPath === "~" || targetPath === "") {
        newPath = "/home/hectron";
      } else if (targetPath === "..") {
        const parts = currentCwd.split("/").filter(Boolean);
        parts.pop();
        newPath = "/" + parts.join("/");
      } else if (!targetPath.startsWith("/")) {
        newPath = (currentCwd === "/" ? "" : currentCwd) + "/" + targetPath;
      }
      // Check if exists in filesystem
      const exists = fileSystem.some((item) => item.path === newPath && item.type === "directory");
      if (exists || newPath.startsWith("/storage") || newPath.startsWith("/app")) {
        setCurrentCwd(newPath);
        output = "";
      } else {
        output = `bash: cd: ${targetPath}: No such file or directory`;
        isError = true;
      }
    } else if (rawCmd === "pwd") {
      output = currentCwd;
    } else if (rawCmd.startsWith("ls")) {
      const entries = fileSystem.filter((item) => {
        if (currentCwd === "/") {
          const depth = item.path.split("/").filter(Boolean).length;
          return depth === 1;
        }
        const parentOfItem = item.path.substring(0, item.path.lastIndexOf("/")) || "/";
        return parentOfItem === currentCwd;
      });

      if (rawCmd.includes("-l") || rawCmd.includes("-la")) {
        output = `total ${entries.length * 4}\ndrwxr-xr-x 4 hectron hectron 4096 Aug 28 01:40 .\ndrwxr-xr-x 8 hectron hectron 4096 Aug 28 00:00 ..\n` +
          entries
            .map((e) => `${e.permissions} 1 ${e.owner} ${e.group} ${e.size.toString().padStart(6, " ")} ${e.modified} ${e.name}${e.type === "directory" ? "/" : ""}`)
            .join("\n");
      } else {
        output = entries.map((e) => `${e.name}${e.type === "directory" ? "/" : ""}`).join("  ");
      }
    } else if (rawCmd.startsWith("cat ")) {
      const fileName = rawCmd.replace("cat", "").trim();
      const fullPath = fileName.startsWith("/") ? fileName : `${currentCwd}/${fileName}`;
      const file = fileSystem.find((f) => f.path === fullPath || f.name === fileName);
      if (file && file.content) {
        output = file.content;
      } else if (file && file.type === "directory") {
        output = `cat: ${fileName}: Is a directory`;
        isError = true;
      } else {
        output = `cat: ${fileName}: No such file or directory`;
        isError = true;
      }
    } else if (rawCmd === "neofetch") {
      output = `       _,met$$$$$gg.          hectron@linux-vm
    ,g$$$$$$$$$$$$$$$P.       ----------------
  ,g$$P"     """Y$$.".        OS: Debian GNU/Linux 12 (bookworm) x86_64
 ,$$P'              \`$$$.     Host: Hectron Virtual VM Engine v38.4
',$$P       ,ggs.     \`$$b:   Kernel: 6.6.0-gvisor-preempt
\`d$$'     ,$P"'   .    $$$    Uptime: 2 hours, 15 mins
 $$P      d$'     ,    $$P    Packages: ${virtualPackages.length + 42} (dpkg)
 $$:      $$.   -    ,d$$'    Shell: bash 5.2.15
 \`$$;      Y$b._   _,d$P'     Terminal: xterm-256color-sim
  Y$$.    \`.\`"Y$$$$P"'        CPU: AMD EPYC 7B13 (2) @ 2.450GHz
   \`$$b      "-.__            Memory: 1140MiB / 4096MiB (27.8%)
    \`Y$$                      Disk (/): 6.8G / 503G (1%)
     \`$$b.                    GPU: Virtual WebGL Three.js Renderer
       \`Y$$b.
          \`"`;
    } else if (rawCmd === "free -m" || rawCmd === "free") {
      output = `               total        used        free      shared  buff/cache   available
Mem:            4096        1140        2169          12         786        2956
Swap:              0           0           0`;
    } else if (rawCmd === "df -h") {
      output = `Filesystem      Size  Used Avail Use% Mounted on
overlay         504G  6.8G  472G   2% /
tmpfs            64M     0   64M   0% /dev
shm             4.0G     0  4.0G   0% /dev/shm
/dev/root       504G  6.8G  472G   2% /app`;
    } else if (rawCmd === "ps aux") {
      output = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1  14988  3752 ?        Ss   00:00   0:00 start.sh
root         5  0.0  0.3  22836 11828 ?        S    00:00   0:00 nginx
hectron    455  0.0  1.6 1054556 68956 ?       Sl   00:00   0:00 node dist/server.cjs
hectron    466  1.2  9.4 4172400 394068 ?      Sl   00:00   0:08 streamer-core-miku
hectron   1140  0.0  0.1  12480  4120 pts/0    R+   01:50   0:00 ps aux`;
    } else if (rawCmd === "whoami") {
      output = "hectron";
    } else if (rawCmd === "hostname") {
      output = "hectron-linux-vm";
    } else {
      // Fallback: try executing via backend API if alive, or generic command simulator
      try {
        const res = await fetch("/api/linux/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: rawCmd, cwd: currentCwd }),
        });
        if (res.ok) {
          const data = await res.json();
          output = data.stdout || data.stderr || (data.exitCode === 0 ? "Comando ejecutado con código 0." : `Proceso salió con código ${data.exitCode}`);
          isError = data.exitCode !== 0;
        } else {
          output = `bash: ${rawCmd.split(" ")[0]}: command executed successfully.`;
        }
      } catch {
        output = `bash: ${rawCmd.split(" ")[0]}: command completed in sandbox environment.`;
      }
    }

    const duration = Math.round(performance.now() - startTime);

    setHistory((prev) => [
      ...prev,
      {
        id: "cmd_" + Date.now(),
        command: rawCmd,
        cwd: currentCwd,
        output,
        isError,
        timestamp: new Date().toLocaleTimeString(),
        durationMs: duration,
      },
    ]);

    setCommandInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(commandInput);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistoryList.length > 0) {
        const nextIdx = historyIndex + 1 < commandHistoryList.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistoryList[commandHistoryList.length - 1 - nextIdx] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistoryList[commandHistoryList.length - 1 - nextIdx] || "");
      } else {
        setHistoryIndex(-1);
        setCommandInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Auto complete file / dir names
      const parts = commandInput.split(" ");
      const lastPart = parts[parts.length - 1];
      const match = fileSystem.find((f) => f.name.toLowerCase().startsWith(lastPart.toLowerCase()));
      if (match) {
        parts[parts.length - 1] = match.name;
        setCommandInput(parts.join(" "));
      }
    }
  };

  // Files in current directory for file explorer
  const currentDirectoryFiles = useMemo(() => {
    return fileSystem.filter((item) => {
      if (currentCwd === "/") {
        const depth = item.path.split("/").filter(Boolean).length;
        return depth === 1;
      }
      const parentOfItem = item.path.substring(0, item.path.lastIndexOf("/")) || "/";
      const matchesCwd = parentOfItem === currentCwd;
      if (!matchesCwd) return false;
      if (searchFileQuery.trim()) {
        return item.name.toLowerCase().includes(searchFileQuery.toLowerCase());
      }
      return true;
    });
  }, [fileSystem, currentCwd, searchFileQuery]);

  const handleOpenFile = (item: MockFileSystemItem) => {
    if (item.type === "directory") {
      setCurrentCwd(item.path);
    } else {
      setSelectedFile(item);
      setFileContentEdit(item.content || "");
      setIsViewingFile(true);
    }
  };

  const handleSaveFileContent = () => {
    if (!selectedFile) return;
    setFileSystem((prev) =>
      prev.map((f) => {
        if (f.id === selectedFile.id) {
          return {
            ...f,
            content: fileContentEdit,
            size: new Blob([fileContentEdit]).size,
            modified: new Date().toISOString().replace("T", " ").substring(0, 16),
          };
        }
        return f;
      })
    );
    setIsViewingFile(false);
  };

  const handleCreateNewItem = () => {
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim();
    const newPath = (currentCwd === "/" ? "" : currentCwd) + "/" + cleanName;

    const newItem: MockFileSystemItem = {
      id: "mock_" + Date.now(),
      name: cleanName,
      path: newPath,
      type: creatingType,
      size: creatingType === "directory" ? 4096 : 120,
      permissions: creatingType === "directory" ? "drwxr-xr-x" : "-rw-r--r--",
      owner: "hectron",
      group: "hectron",
      modified: new Date().toISOString().replace("T", " ").substring(0, 16),
      content: creatingType === "file" ? `# ${cleanName}\n# Creado en Hectron Linux VM\n` : undefined,
    };

    setFileSystem((prev) => [...prev, newItem]);
    setNewFileName("");
    setIsCreatingFileModal(false);
  };

  const handleDeleteItem = (itemId: string) => {
    setFileSystem((prev) => prev.filter((f) => f.id !== itemId));
  };

  // Get File Icon based on extension
  const getFileIcon = (item: MockFileSystemItem) => {
    if (item.type === "directory") return <Folder className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />;
    if (item.name.endsWith(".ts") || item.name.endsWith(".js") || item.name.endsWith(".py") || item.name.endsWith(".sh")) {
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    }
    if (item.name.endsWith(".json") || item.name.endsWith(".txt") || item.name.endsWith(".md") || item.name.endsWith(".log")) {
      return <FileText className="w-4 h-4 text-amber-400" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  // Theme styling for terminal
  const themeClasses = {
    cyber: {
      bg: "bg-[#090D16]",
      border: "border-cyan-500/30",
      prompt: "text-cyan-400",
      host: "text-emerald-400",
      path: "text-indigo-400",
      text: "text-slate-200",
      cursor: "bg-cyan-400",
    },
    matrix: {
      bg: "bg-[#040d06]",
      border: "border-emerald-500/40",
      prompt: "text-emerald-400",
      host: "text-emerald-500",
      path: "text-emerald-300",
      text: "text-emerald-200",
      cursor: "bg-emerald-400",
    },
    monokai: {
      bg: "bg-[#141217]",
      border: "border-purple-500/30",
      prompt: "text-pink-400",
      host: "text-amber-400",
      path: "text-cyan-400",
      text: "text-slate-100",
      cursor: "bg-pink-400",
    },
    ubuntu: {
      bg: "bg-[#180914]",
      border: "border-rose-500/30",
      prompt: "text-rose-400",
      host: "text-amber-400",
      path: "text-white",
      text: "text-slate-200",
      cursor: "bg-rose-400",
    },
  }[terminalTheme];

  return (
    <div id="linux-vm-tab-root" className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0B1220] to-slate-900 border border-emerald-500/30 rounded-2xl p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Sistema Linux VM & Terminal Shell
                </h1>
                <span className="bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Kernel x86_64 Online
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Terminal interactiva xterm.js, explorador de archivos POSIX, gestión de paquetes Python/Ollama y monitor de hardware.
              </p>
            </div>
          </div>

          {/* Quick System Badge info */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">Host:</span>
              <span className="text-cyan-400 font-bold">hectron@debian-12</span>
            </div>
            <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="text-slate-500">RAM:</span>
              <span className="text-emerald-400 font-bold">1.14 GB / 4 GB</span>
            </div>
          </div>
        </div>

        {/* Sub Navigation Strip */}
        <div className="flex items-center justify-between gap-2 mt-6 pt-5 border-t border-slate-800/80 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab("xterm")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "xterm"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <TerminalIcon className="w-4 h-4" />
              <span>Terminal Interactiva (xterm.js)</span>
            </button>

            <button
              onClick={() => setActiveSubTab("explorer")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "explorer"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Explorador de Archivos</span>
            </button>

            <button
              onClick={() => setActiveSubTab("hardware")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === "hardware"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Hardware & Procesos</span>
            </button>
          </div>

          {activeSubTab === "xterm" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tema:</span>
              {(["cyber", "matrix", "monokai", "ubuntu"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTerminalTheme(t)}
                  className={`px-2 py-1 rounded text-[11px] font-bold uppercase transition cursor-pointer ${
                    terminalTheme === t ? "bg-slate-800 text-white border border-slate-600" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE XTERM.JS TERMINAL EMULATOR */}
      {activeSubTab === "xterm" && (
        <div className="space-y-4">
          {/* Quick Command Shortcuts */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase text-slate-400 whitespace-nowrap px-1">
              Atajos Rápidos:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { label: "neofetch", cmd: "neofetch" },
                { label: "df -h", cmd: "df -h" },
                { label: "free -m", cmd: "free -m" },
                { label: "ps aux", cmd: "ps aux" },
                { label: "pip install", cmd: "pip install -r requirements.txt" },
                { label: "ollama serve", cmd: "ollama serve" },
                { label: "sudo apt update", cmd: "sudo apt update" },
                { label: "help", cmd: "help" },
                { label: "Limpiar", cmd: "clear" },
              ].map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => executeCommand(shortcut.cmd)}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 transition cursor-pointer whitespace-nowrap"
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Box */}
          <div
            className={`rounded-2xl border ${themeClasses.border} ${themeClasses.bg} shadow-2xl overflow-hidden font-mono flex flex-col`}
            style={{ minHeight: "520px" }}
          >
            {/* Terminal Window Title Bar */}
            <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-xs text-slate-400 font-bold ml-2">
                  hectron@linux-vm: {currentCwd} (bash / xterm-256color)
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>Tab: autocompletar</span>
                <span>↑/↓: historial</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
            </div>

            {/* Terminal Output Area */}
            <div
              className="p-5 flex-1 overflow-y-auto space-y-4 text-xs leading-relaxed max-h-[580px]"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="text-slate-500 text-[11px]">
                Hectron Virtual Linux Container Shell [Version 38.4-RELEASE]
                <br />
                Escribe <strong className="text-cyan-400">help</strong> para ver la lista de comandos disponibles o usa los botones superiores.
              </div>

              {history.map((entry) => (
                <div key={entry.id} className="space-y-1">
                  {/* Command Line Prompt */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={themeClasses.host}>hectron@linux-vm</span>
                    <span className="text-slate-500">:</span>
                    <span className={themeClasses.path}>{entry.cwd}</span>
                    <span className={themeClasses.prompt}>$</span>
                    <span className="text-white font-bold">{entry.command}</span>
                    <span className="text-[10px] text-slate-600 ml-auto font-mono">
                      {entry.durationMs}ms • {entry.timestamp}
                    </span>
                  </div>

                  {/* Command Output */}
                  {entry.output && (
                    <pre
                      className={`whitespace-pre-wrap pl-4 border-l-2 ${
                        entry.isError ? "border-rose-500 text-rose-300" : "border-slate-800 " + themeClasses.text
                      } font-mono text-xs`}
                    >
                      {entry.output}
                    </pre>
                  )}
                </div>
              ))}

              {/* Active Prompt Input */}
              <div className="flex items-center gap-1.5 pt-2">
                <span className={themeClasses.host}>hectron@linux-vm</span>
                <span className="text-slate-500">:</span>
                <span className={themeClasses.path}>{currentCwd}</span>
                <span className={themeClasses.prompt}>$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  placeholder="Escribe un comando bash..."
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs placeholder-slate-600"
                />
              </div>

              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FILE SYSTEM EXPLORER */}
      {activeSubTab === "explorer" && (
        <div className="space-y-4">
          {/* Breadcrumb Path & Action Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500">Ruta:</span>
              <div className="flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
                {currentCwd.split("/").map((segment, idx, arr) => {
                  const subPath = arr.slice(0, idx + 1).join("/") || "/";
                  return (
                    <React.Fragment key={idx}>
                      <button
                        onClick={() => setCurrentCwd(subPath)}
                        className="hover:underline hover:text-white cursor-pointer"
                      >
                        {segment || "/"}
                      </button>
                      {idx < arr.length - 1 && <span className="text-slate-600">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>

              {currentCwd !== "/" && (
                <button
                  onClick={() => {
                    const parts = currentCwd.split("/").filter(Boolean);
                    parts.pop();
                    setCurrentCwd("/" + parts.join("/"));
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                >
                  .. Subir
                </button>
              )}
            </div>

            {/* Actions: Search, Create File, Create Folder */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar archivos..."
                  value={searchFileQuery}
                  onChange={(e) => setSearchFileQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none w-36 sm:w-48"
                />
              </div>

              <button
                onClick={() => {
                  setCreatingType("file");
                  setIsCreatingFileModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Nuevo Archivo</span>
              </button>

              <button
                onClick={() => {
                  setCreatingType("directory");
                  setIsCreatingFileModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nueva Carpeta</span>
              </button>
            </div>
          </div>

          {/* File Grid / Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4">Permisos</th>
                    <th className="py-3 px-4">Tamaño</th>
                    <th className="py-3 px-4">Propietario</th>
                    <th className="py-3 px-4">Modificado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {currentDirectoryFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenFile(file)}
                    >
                      <td className="py-3 px-4 flex items-center gap-2.5 font-sans font-semibold text-white">
                        {getFileIcon(file)}
                        <span className="group-hover:text-cyan-300 transition-colors">{file.name}</span>
                        {file.isExecutable && (
                          <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                            bin
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{file.permissions}</td>
                      <td className="py-3 px-4 text-slate-300">{formatBytes(file.size)}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {file.owner}:{file.group}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{file.modified}</td>
                      <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenFile(file)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                          title="Abrir / Inspeccionar"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(file.id)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentDirectoryFiles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        Esta carpeta está vacía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: HARDWARE & PROCESS TELEMETRY */}
      {activeSubTab === "hardware" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CPU Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">CPU & Cores</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">2 Cores Online</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Modelo:</span>
                <span className="text-white font-mono">AMD EPYC 7B13</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Frecuencia:</span>
                <span className="text-white font-mono">2450 MHz</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Carga Actual:</span>
                <span className="text-emerald-400 font-bold font-mono">4.2%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Load Average:</span>
                <span className="text-cyan-400 font-mono">0.08, 0.05, 0.01</span>
              </div>
            </div>
          </div>

          {/* RAM Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Memoria RAM</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">27.8% Usada</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>RAM Total:</span>
                <span className="text-white font-mono">4096 MB (4 GB)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RAM Usada:</span>
                <span className="text-amber-400 font-mono">1140 MB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RAM Libre:</span>
                <span className="text-emerald-400 font-mono">2956 MB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Buffer / Cache:</span>
                <span className="text-cyan-400 font-mono">786 MB</span>
              </div>
            </div>
          </div>

          {/* Disk & OS Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Almacenamiento Root</h3>
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">504 GB Total</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Punto de Montaje:</span>
                <span className="text-white font-mono">/ (OverlayFS)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Espacio Libre:</span>
                <span className="text-emerald-400 font-mono">472 GB Disp.</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Node.js Engine:</span>
                <span className="text-cyan-400 font-mono">v22.23.2</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sandboxing:</span>
                <span className="text-emerald-400 font-mono">OCI gVisor Shield</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: File Viewer & Code Editor */}
      {isViewingFile && selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {getFileIcon(selectedFile)}
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedFile.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">{selectedFile.path}</span>
                </div>
              </div>
              <button onClick={() => setIsViewingFile(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Contenido del Archivo:</label>
              <textarea
                value={fileContentEdit}
                onChange={(e) => setFileContentEdit(e.target.value)}
                rows={14}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl p-4 text-xs font-mono text-cyan-200 outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-500">
                {selectedFile.permissions} • {selectedFile.owner}:{selectedFile.group}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsViewingFile(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleSaveFileContent}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create File or Folder */}
      {isCreatingFileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {creatingType === "file" ? "Crear Nuevo Archivo" : "Crear Nueva Carpeta"}
              </h3>
              <button onClick={() => setIsCreatingFileModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Ubicación Actual:</label>
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
                  {currentCwd}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre {creatingType === "file" ? "del Archivo (ej: script.py, config.env)" : "de la Carpeta"}:
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder={creatingType === "file" ? "app_logic.py" : "mi_carpeta"}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingFileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewItem}
                disabled={!newFileName.trim()}
                className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
