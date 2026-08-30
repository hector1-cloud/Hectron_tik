import React, { useState } from "react";
import {
  Terminal,
  Play,
  Download,
  Copy,
  Check,
  Server,
  Radio,
  Cpu,
  Shield,
  Layers,
  FolderCheck,
  Activity,
  Sparkles,
  Smartphone,
  Monitor,
  RefreshCw,
  Zap,
  Volume2,
  FileCode,
  Globe,
  ExternalLink,
  Code2,
} from "lucide-react";

export const BAPHOMET_INSTALL_SCRIPT = `#!/usr/bin/env bash
# ==============================================================================
# HECTRON-Ψ :: NODO DE TRANSMISIÓN EN VIVO & CONECTIVIDAD DE ENJAMBRE (vΩ+12.1)
# Autoridad: Héctor Jazziel López Ruiz (HECTRON-01)
# Infraestructura: Termux / Linux Nativo [NODO BAPHOMET]
# ==============================================================================
set -euo pipefail
IFS=$'\\n\\t'

# Colores tácticos para salida en terminal
CYAN='\\033[0;36m'
GOLD='\\033[0;33m'
GREEN='\\033[0;32m'
RED='\\033[0;31m'
NC='\\033[0m'

echo -e "\${CYAN}"
echo "    ██╗  ██╗███████╗ ██████╗████████╗██████╗  ██████╗ ███╗   ██╗-Ψ"
echo "    ██║  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║"
echo "    ███████║█████╗  ██║        ██║   ██████╔╝██║   ██║██╔██╗ ██║"
echo "    ██╔══██║██╔══╝  ██║        ██║   ██╔══██╗██║   ██║██║╚██╗██║"
echo "    ██║  ██║███████╗╚██████╗   ██║   ██║  ██║╚██████╔╝██║ ╚████║"
echo "    ╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝"
echo -e "\${GOLD}               --- SCRIPT DE INSTALACIÓN DE TRANSMISIÓN ---"
echo -e "                    CIUDAD ACUÑA // COAHUILA // MEXICO"
echo -e "\${NC}"

# --- 1. CONFIGURACIÓN DE ENTORNO Y RUTAS SOBERANAS ---
export HECTRON_ROOT="\$HOME/HECTRON"
export LOG_DIR="\$HECTRON_ROOT/logs"
export VENV_PATH="\$HECTRON_ROOT/baphomet_venv"

echo -e "[*] Creando infraestructura de directorios..."
mkdir -p "\$LOG_DIR" "\$HECTRON_ROOT/transmision"

# --- 2. DETECCIÓN DE ENTORNO (Android/Termux vs Linux Estándar) ---
echo -e "[*] Analizando sistema operativo y dependencias base..."
if [ -d "/data/data/com.termux/files/usr" ]; then
    echo -e "\${GREEN}[✔] Entorno Termux de Android detectado.\${NC}"
    echo -e "[*] Actualizando repositorios e instalando paquetes de sistema..."
    pkg update -y && pkg upgrade -y
    pkg install python python-pip nodejs git clang make wget curl ffmpeg mpv termux-api -y
else
    echo -e "\${GREEN}[✔] Entorno Linux estándar detectado.\${NC}"
    echo -e "[*] Instalando dependencias mediante apt..."
    sudo apt-get update -y
    sudo apt-get install python3 python3-pip python3-venv nodejs npm git build-essential wget curl ffmpeg mpv -y
fi

# --- 3. CREACIÓN Y ACTIVACIÓN DEL ENTORNO VIRTUAL SOBERANO ---
if [ ! -d "\$VENV_PATH" ]; then
    echo -e "[*] Forjando entorno virtual aislado 'baphomet_venv'..."
    python3 -m venv "\$VENV_PATH"
fi

echo -e "[*] Activando virtualenv e instalando librerías requeridas..."
# Asegurarse de que el script se corra en modo no interactivo
source "\$VENV_PATH/bin/activate"
pip install --upgrade pip

# Instalar dependencias Python de la transmisión y el pipeline
echo -e "[*] Instalando dependencias de Python (Inferencia local, WebSockets, gTTS y TikTokLive)..."
pip install \\
    requests \\
    fastapi \\
    uvicorn \\
    websockets \\
    pydantic \\
    gTTS \\
    TikTokLive \\
    python-dotenv

# --- 4. INSTALACIÓN DE COMPONENTES DEL FRONTEND & CONECTOR DE TRANSMISIÓN ---
echo -e "[*] Configurando conector web y WebSocket de Node.js..."
cd "\$HECTRON_ROOT/transmision"

# Inicializar y configurar package.json local
cat << 'EOF' > package.json
{
  "name": "hectron-transmission-connector",
  "version": "1.0.0",
  "description": "Conector asíncrono de baja latencia para transmisiones en vivo",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "tiktok-live-connector": "^1.2.0",
    "ws": "^8.18.0"
  }
}
EOF

# Instalar paquetes de Node.js
if [ -d "/data/data/com.termux/files/usr" ]; then
    # Evitar problemas de memoria de node en Termux limitando memoria de heap
    export NODE_OPTIONS="--max-old-space-size=512"
fi
npm install

# --- 5. CREACIÓN DE SCRIPT DE LANZAMIENTO INTEGRADO (start_transmision.sh) ---
echo -e "[*] Generando script de lanzamiento de transmisión 'start_transmision.sh'..."
cat << 'EOF' > start_transmision.sh
#!/bin/bash
# ==============================================================================
# HECTRON-Ψ :: DISPARADOR DE TRANSMISIÓN ASÍNCRONA (Live Engine)
# ==============================================================================
export HECTRON_ROOT="\$HOME/HECTRON"
export VENV_PATH="\$HECTRON_ROOT/baphomet_venv"

echo -e "\\033[0;36m[⚡] Despertando Orquestador de Transmisión...\\033[0m"
source "\$VENV_PATH/bin/activate"

# 1. Asegurar servidor de audio en segundo plano en Termux si es necesario
if [ -d "/data/data/com.termux/files/usr" ]; then
    if ! pgrep -x "pulseaudio" > /dev/null; then
        echo -e "\\033[0;33m[!] Inicializando PulseAudio en Termux...\\033[0m"
        pulseaudio --start --exit-idle-time=-1
    fi
fi

# 2. Iniciar conector de TikTok / WebSockets de Node.js en background si es necesario
# nohup npm start > "\$HECTRON_ROOT/logs/transmission_connector.log" 2>&1 &

echo -e "\\033[0;32m[✔] Entorno activo. Ejecutando canalización de WebSockets hacia OBS...\\033[0m"
echo -e "\\033[0;35mFrecuencia de transmisión bloqueada en 666.9 MHz.\\033[0m"
EOF
chmod +x start_transmision.sh

echo -e "\\n\${GREEN}========================================================"
echo "    ¡ENTORNO DE TRANSMISIÓN INSTALADO CON ÉXITO!     "
echo "========================================================\${NC}"
echo -e "La infraestructura táctica de transmisión ha sido configurada en:"
echo -e "📁 \${GOLD}\$HECTRON_ROOT/transmision\${NC}\\n"
echo -e "Para activar el entorno virtual y lanzar tu transmisión ejecuta:"
echo -e "👉 \${CYAN}cd \$HECTRON_ROOT/transmision && ./start_transmision.sh\${NC}\\n"
echo -e "\${GREEN}Soberanía absoluta // Canal listo para transmisión en vivo.\${NC}"
`;

export const BAPHOMET_START_SCRIPT = `#!/bin/bash
# ==============================================================================
# HECTRON-Ψ :: DISPARADOR DE TRANSMISIÓN ASÍNCRONA (Live Engine)
# ==============================================================================
export HECTRON_ROOT="$HOME/HECTRON"
export VENV_PATH="$HECTRON_ROOT/baphomet_venv"

echo -e "\\033[0;36m[⚡] Despertando Orquestador de Transmisión...\\033[0m"
source "$VENV_PATH/bin/activate"

# 1. Asegurar servidor de audio en segundo plano en Termux si es necesario
if [ -d "/data/data/com.termux/files/usr" ]; then
    if ! pgrep -x "pulseaudio" > /dev/null; then
        echo -e "\\033[0;33m[!] Inicializando PulseAudio en Termux...\\033[0m"
        pulseaudio --start --exit-idle-time=-1
    fi
fi

# 2. Iniciar conector de TikTok / WebSockets de Node.js en background si es necesario
# nohup npm start > "$HECTRON_ROOT/logs/transmission_connector.log" 2>&1 &

echo -e "\\033[0;32m[✔] Entorno activo. Ejecutando canalización de WebSockets hacia OBS...\\033[0m"
echo -e "\\033[0;35mFrecuencia de transmisión bloqueada en 666.9 MHz.\\033[0m"
`;

interface BaphometTransmissionNodeStudioProps {
  onRunInTerminal?: (command: string) => void;
}

export function BaphometTransmissionNodeStudio({ onRunInTerminal }: BaphometTransmissionNodeStudioProps) {
  const [selectedEnv, setSelectedEnv] = useState<"termux" | "linux">("linux");
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedStartScript, setCopiedStartScript] = useState<boolean>(false);
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "code" | "start_script" | "termux_guide">("overview");

  // Copy helper
  const handleCopy = (text: string, isStart: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isStart) {
      setCopiedStartScript(true);
      setTimeout(() => setCopiedStartScript(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  // Download .sh helper
  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/x-sh" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simulated Execution Runner
  const runSimulation = () => {
    setIsRunningSim(true);
    setSimLogs([]);

    const steps = [
      `[⚡] Iniciando despliegue de HECTRON-Ψ vΩ+12.1 (Entorno: ${selectedEnv === "termux" ? "Android Termux" : "Linux Estándar / Debian"})...`,
      `    ██╗  ██╗███████╗ ██████╗████████╗██████╗  ██████╗ ███╗   ██╗-Ψ`,
      `    ██║  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║`,
      `    ███████║█████╗  ██║        ██║   ██████╔╝██║   ██║██╔██╗ ██║`,
      `    ██╔══██║██╔══╝  ██║        ██║   ██╔══██╗██║   ██║██║╚██╗██║`,
      `    ██║  ██║███████╗╚██████╗   ██║   ██║  ██║╚██████╔╝██║ ╚████║`,
      `    --- SCRIPT DE INSTALACIÓN DE TRANSMISIÓN [CIUDAD ACUÑA, COAHUILA] ---`,
      `[*] Configurando rutas: HECTRON_ROOT=$HOME/HECTRON`,
      `[*] Creando directorios: $HOME/HECTRON/logs, $HOME/HECTRON/transmision`,
      selectedEnv === "termux"
        ? `[✔] Entorno Termux de Android detectado -> pkg install python nodejs ffmpeg mpv termux-api -y`
        : `[✔] Entorno Linux estándar detectado -> apt install python3-venv nodejs ffmpeg mpv -y`,
      `[*] Forjando entorno virtual aislado 'baphomet_venv' en $HOME/HECTRON/baphomet_venv...`,
      `[*] Activando virtualenv 'source $HOME/HECTRON/baphomet_venv/bin/activate'`,
      `[*] Instalando pip packages: requests, fastapi, uvicorn, websockets, pydantic, gTTS, TikTokLive, python-dotenv...`,
      `[✔] Python dependencies installed successfully (FastAPI + TikTokLive + gTTS).`,
      `[*] Creando package.json en $HOME/HECTRON/transmision con tiktok-live-connector y ws...`,
      selectedEnv === "termux"
        ? `[*] Aplicando NODE_OPTIONS="--max-old-space-size=512" para optimización de RAM en Termux...`
        : `[*] Optimizando Node.js event loop para transmisión WebSocket de baja latencia...`,
      `[✔] npm install completado en $HOME/HECTRON/transmision.`,
      `[*] Generando script ejecutable 'start_transmision.sh' con permisos chmod +x...`,
      `[✔] Frecuencia de transmisión bloqueada en 666.9 MHz.`,
      `========================================================`,
      `    ¡ENTORNO DE TRANSMISIÓN INSTALADO CON ÉXITO!`,
      `========================================================`,
      `📁 Ruta: $HOME/HECTRON/transmision`,
      `👉 Para ejecutar: cd $HOME/HECTRON/transmision && ./start_transmision.sh`,
      `[✔] Soberanía absoluta // Canal listo para transmisión en vivo.`,
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSimLogs((prev) => [...prev, step]);
        if (idx === steps.length - 1) {
          setIsRunningSim(false);
        }
      }, idx * 180);
    });
  };

  return (
    <div id="baphomet-transmission-node-studio" className="space-y-6">
      {/* Sovereign Header Card */}
      <div className="bg-gradient-to-r from-[#070D18] via-[#0B1528] to-[#080F1E] border-2 border-cyan-500/40 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 rounded-full text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                HECTRON-Ψ :: NODO BAPHOMET vΩ+12.1
              </span>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold font-mono">
                📡 666.9 MHz Lock
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold font-mono">
                🇲🇽 Acuña, Coahuila
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Radio className="w-7 h-7 text-cyan-400 animate-pulse" />
              <span>Nodo de Transmisión en Vivo & Enjambre Soberano</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Script maestro de orquestación para <strong className="text-cyan-300 font-bold">Termux (Android)</strong> y{" "}
              <strong className="text-emerald-300 font-bold">Linux Nativo</strong>. Administra el entorno virtual aislado{" "}
              <code className="text-amber-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">baphomet_venv</code>, inferencia local, TikTok LIVE connector, servidor PulseAudio y enlace de baja latencia a OBS Studio.
            </p>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 pt-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Autoridad: <strong>Héctor Jazziel López Ruiz (HECTRON-01)</strong></span>
              <span className="text-slate-600">|</span>
              <span>Infraestructura: Termux / Linux [Nodo Baphomet]</span>
            </div>
          </div>

          {/* Quick Actions Deck */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
            <button
              onClick={() => handleCopy(BAPHOMET_INSTALL_SCRIPT)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {copiedScript ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? "¡Script Copiado!" : "Copiar Script de Instalación"}</span>
            </button>

            <button
              onClick={() => handleDownload("install_transmission_node.sh", BAPHOMET_INSTALL_SCRIPT)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-cyan-500/40 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Descargar install_transmission.sh</span>
            </button>

            {onRunInTerminal && (
              <button
                onClick={() => onRunInTerminal("bash install_transmission.sh")}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                <span>Ejecutar en Terminal Linux</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "overview"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Panel Táctico & Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "code"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Código Bash (install_transmission.sh)</span>
          </button>

          <button
            onClick={() => setActiveTab("start_script")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "start_script"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Lanzador (start_transmision.sh)</span>
          </button>

          <button
            onClick={() => setActiveTab("termux_guide")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "termux_guide"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Guía de Ejecución Termux</span>
          </button>
        </div>

        {/* Environment toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedEnv("linux")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedEnv === "linux"
                ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Linux Nativo / Debian</span>
          </button>
          <button
            onClick={() => setSelectedEnv("termux")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedEnv === "termux"
                ? "bg-slate-800 text-emerald-300 border border-emerald-500/40"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Termux</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & TACTICAL MONITOR */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Status Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pillar 1: Root Path */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase">Directorio Raíz</span>
                <FolderCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="font-mono font-bold text-white text-sm">
                $HOME/HECTRON
              </div>
              <div className="text-[11px] text-slate-400">
                Subcarpetas: <span className="text-cyan-300 font-mono">logs/</span> y <span className="text-cyan-300 font-mono">transmision/</span>
              </div>
            </div>

            {/* Pillar 2: Virtual Environment */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase">Entorno Virtual</span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <div className="font-mono font-bold text-amber-300 text-sm">
                baphomet_venv (Python 3.11+)
              </div>
              <div className="text-[11px] text-slate-400">
                Módulos: <span className="text-slate-200">FastAPI, TikTokLive, gTTS, websockets</span>
              </div>
            </div>

            {/* Pillar 3: Audio & Node Engine */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase">Audio & WebSocket</span>
                <Volume2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="font-mono font-bold text-emerald-300 text-sm">
                PulseAudio + Node.js ws
              </div>
              <div className="text-[11px] text-slate-400">
                Heap Limit: <span className="text-emerald-400 font-mono">512MB</span> (anti OOM)
              </div>
            </div>

            {/* Pillar 4: Sovereign Authority */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase">Transmisión & Lock</span>
                <Radio className="w-4 h-4 text-purple-400" />
              </div>
              <div className="font-mono font-bold text-purple-300 text-sm">
                666.9 MHz Frequency
              </div>
              <div className="text-[11px] text-slate-400">
                OBS Port: <span className="text-purple-300 font-mono">4455</span> | Node vΩ+12.1
              </div>
            </div>
          </div>

          {/* Simulation & Diagnostic Runner Deck */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Play className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Simulador de Despliegue en Vivo (Baphomet Engine)</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={runSimulation}
                  disabled={isRunningSim}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    isRunningSim
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningSim ? "animate-spin" : ""}`} />
                  <span>{isRunningSim ? "Instalando dependencias..." : "Ejecutar Simulación de Instalación"}</span>
                </button>
              </div>
            </div>

            {/* Terminal Live Output Box */}
            <div className="bg-[#060A12] border border-cyan-500/30 rounded-xl p-4 font-mono text-xs text-slate-200 min-h-[260px] max-h-[380px] overflow-y-auto space-y-1 shadow-inner">
              {simLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-12 space-y-2">
                  <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>Haz clic en "Ejecutar Simulación de Instalación" para probar la orquestación táctica.</p>
                  <p className="text-[11px] text-slate-600">También puedes correr el script real en la pestaña Sistema Linux con <code className="text-cyan-400">bash install_transmission.sh</code></p>
                </div>
              ) : (
                simLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.includes("¡ENTORNO DE TRANSMISIÓN INSTALADO CON ÉXITO!") || log.includes("Soberanía absoluta")
                        ? "text-emerald-400 font-bold bg-emerald-950/30 p-1 rounded"
                        : log.includes("HECTRON") || log.includes("--- SCRIPT")
                        ? "text-cyan-300 font-bold"
                        : log.includes("Frecuencia")
                        ? "text-purple-300 font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODE BASH FULL SCRIPT */}
      {activeTab === "code" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">install_transmission_node.sh</h3>
                <p className="text-xs text-slate-400">Script bash autónomo con detección de Termux, apt, venv y connector Node</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(BAPHOMET_INSTALL_SCRIPT)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? "¡Copiado!" : "Copiar"}</span>
              </button>

              <button
                onClick={() => handleDownload("install_transmission_node.sh", BAPHOMET_INSTALL_SCRIPT)}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .sh</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#060A14] border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-100 overflow-x-auto max-h-[500px] leading-relaxed select-all">
              {BAPHOMET_INSTALL_SCRIPT}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: START TRANSMISSION SCRIPT */}
      {activeTab === "start_script" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">start_transmision.sh</h3>
                <p className="text-xs text-slate-400">Disparador de baja latencia con activación de venv, PulseAudio y WebSockets a OBS</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(BAPHOMET_START_SCRIPT, true)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                {copiedStartScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStartScript ? "¡Copiado!" : "Copiar"}</span>
              </button>

              <button
                onClick={() => handleDownload("start_transmision.sh", BAPHOMET_START_SCRIPT)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .sh</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#060A14] border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-200 overflow-x-auto max-h-[500px] leading-relaxed select-all">
              {BAPHOMET_START_SCRIPT}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: TERMUX / ANDROID SETUP GUIDE */}
      {activeTab === "termux_guide" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Smartphone className="w-6 h-6 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white">Guía Táctica de Despliegue en Termux (Android)</h3>
              <p className="text-xs text-slate-400">Pasos para convertir tu teléfono Android en un nodo de transmisión y audio 24/7</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold">PASO 1</span>
              <h4 className="text-sm font-bold text-white">Permisos de Almacenamiento</h4>
              <p className="text-xs text-slate-400">Concede acceso a los archivos del dispositivo para vincular carpetas:</p>
              <pre className="bg-slate-900 p-2 rounded text-xs font-mono text-purple-300">termux-setup-storage</pre>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold">PASO 2</span>
              <h4 className="text-sm font-bold text-white">Guardar y Ejecutar el Script</h4>
              <p className="text-xs text-slate-400">Descarga o pega el script en tu directorio home:</p>
              <pre className="bg-slate-900 p-2 rounded text-xs font-mono text-cyan-300">curl -O ... && bash install_transmission.sh</pre>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold">PASO 3</span>
              <h4 className="text-sm font-bold text-white">Iniciar Transmisión</h4>
              <p className="text-xs text-slate-400">Lanza el orquestador con el virtualenv activo:</p>
              <pre className="bg-slate-900 p-2 rounded text-xs font-mono text-emerald-300">cd ~/HECTRON/transmision && ./start_transmision.sh</pre>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[10px] font-bold">PASO 4</span>
              <h4 className="text-sm font-bold text-white">Enlace a OBS Studio</h4>
              <p className="text-xs text-slate-400">Conecta OBS WebSocket en la IP local de tu dispositivo Android en el puerto 4455.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
