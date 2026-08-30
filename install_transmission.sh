#!/usr/bin/env bash
# ==============================================================================
# HECTRON-Ψ :: NODO DE TRANSMISIÓN EN VIVO & CONECTIVIDAD DE ENJAMBRE (vΩ+12.1)
# Autoridad: Héctor Jazziel López Ruiz (HECTRON-01)
# Infraestructura: Termux / Linux Nativo [NODO BAPHOMET]
# ==============================================================================
set -euo pipefail
IFS=$'\n\t'

# Colores tácticos para salida en terminal
CYAN='\033[0;36m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "    ██╗  ██╗███████╗ ██████╗████████╗██████╗  ██████╗ ███╗   ██╗-Ψ"
echo "    ██║  ██║██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║"
echo "    ███████║█████╗  ██║        ██║   ██████╔╝██║   ██║██╔██╗ ██║"
echo "    ██╔══██║██╔══╝  ██║        ██║   ██╔══██╗██║   ██║██║╚██╗██║"
echo "    ██║  ██║███████╗╚██████╗   ██║   ██║  ██║╚██████╔╝██║ ╚████║"
echo "    ╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝"
echo -e "${GOLD}               --- SCRIPT DE INSTALACIÓN DE TRANSMISIÓN ---"
echo -e "                    CIUDAD ACUÑA // COAHUILA // MEXICO"
echo -e "${NC}"

# --- 1. CONFIGURACIÓN DE ENTORNO Y RUTAS SOBERANAS ---
export HECTRON_ROOT="$HOME/HECTRON"
export LOG_DIR="$HECTRON_ROOT/logs"
export VENV_PATH="$HECTRON_ROOT/baphomet_venv"

echo -e "[*] Creando infraestructura de directorios..."
mkdir -p "$LOG_DIR" "$HECTRON_ROOT/transmision"

# --- 2. DETECCIÓN DE ENTORNO (Android/Termux vs Linux Estándar) ---
echo -e "[*] Analizando sistema operativo y dependencias base..."
if [ -d "/data/data/com.termux/files/usr" ]; then
    echo -e "${GREEN}[✔] Entorno Termux de Android detectado.${NC}"
    echo -e "[*] Actualizando repositorios e instalando paquetes de sistema..."
    pkg update -y && pkg upgrade -y
    pkg install python python-pip nodejs git clang make wget curl ffmpeg mpv termux-api -y
else
    echo -e "${GREEN}[✔] Entorno Linux estándar detectado.${NC}"
    echo -e "[*] Instalando dependencias mediante apt..."
    sudo apt-get update -y
    sudo apt-get install python3 python3-pip python3-venv nodejs npm git build-essential wget curl ffmpeg mpv -y
fi

# --- 3. CREACIÓN Y ACTIVACIÓN DEL ENTORNO VIRTUAL SOBERANO ---
if [ ! -d "$VENV_PATH" ]; then
    echo -e "[*] Forjando entorno virtual aislado 'baphomet_venv'..."
    python3 -m venv "$VENV_PATH"
fi

echo -e "[*] Activando virtualenv e instalando librerías requeridas..."
# Asegurarse de que el script se corra en modo no interactivo
source "$VENV_PATH/bin/activate"
pip install --upgrade pip

# Instalar dependencias Python de la transmisión y el pipeline
echo -e "[*] Instalando dependencias de Python (Inferencia local, WebSockets, gTTS y TikTokLive)..."
pip install \
    requests \
    fastapi \
    uvicorn \
    websockets \
    pydantic \
    gTTS \
    TikTokLive \
    python-dotenv

# --- 4. INSTALACIÓN DE COMPONENTES DEL FRONTEND & CONECTOR DE TRANSMISIÓN ---
echo -e "[*] Configurando conector web y WebSocket de Node.js..."
cd "$HECTRON_ROOT/transmision"

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
export HECTRON_ROOT="$HOME/HECTRON"
export VENV_PATH="$HECTRON_ROOT/baphomet_venv"

echo -e "\033[0;36m[⚡] Despertando Orquestador de Transmisión...\033[0m"
source "$VENV_PATH/bin/activate"

# 1. Asegurar servidor de audio en segundo plano en Termux si es necesario
if [ -d "/data/data/com.termux/files/usr" ]; then
    if ! pgrep -x "pulseaudio" > /dev/null; then
        echo -e "\033[0;33m[!] Inicializando PulseAudio en Termux...\033[0m"
        pulseaudio --start --exit-idle-time=-1
    fi
fi

# 2. Iniciar conector de TikTok / WebSockets de Node.js en background si es necesario
# nohup npm start > "$HECTRON_ROOT/logs/transmission_connector.log" 2>&1 &

echo -e "\033[0;32m[✔] Entorno activo. Ejecutando canalización de WebSockets hacia OBS...\033[0m"
echo -e "\033[0;35mFrecuencia de transmisión bloqueada en 666.9 MHz.\033[0m"
EOF
chmod +x start_transmision.sh

echo -e "\n${GREEN}========================================================"
echo "    ¡ENTORNO DE TRANSMISIÓN INSTALADO CON ÉXITO!     "
echo "========================================================${NC}"
echo -e "La infraestructura táctica de transmisión ha sido configurada en:"
echo -e "📁 ${GOLD}$HECTRON_ROOT/transmision${NC}\n"
echo -e "Para activar el entorno virtual y lanzar tu transmisión ejecuta:"
echo -e "👉 ${CYAN}cd $HECTRON_ROOT/transmision && ./start_transmision.sh${NC}\n"
echo -e "${GREEN}Soberanía absoluta // Canal listo para transmisión en vivo.${NC}"
