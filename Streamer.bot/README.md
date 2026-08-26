# 🤖 Streamer.bot Integration for HECTRON Streamer Studio

Configuración y puente de sincronización bidireccional entre **Streamer.bot** (versión 0.2.x o superior) y **HECTRON Streamer Studio**.

---

## 🚀 Arquitectura de Comunicación

```
[TikTok LIVE / Overlay] 
       ↕ (HTTP / WebSocket)
[HECTRON Server (Node/Express)]
       ↕ (WebSocket @ 127.0.0.1:8080)
[Streamer.bot (C# Runtime & Actions)]
       ↕ (OBS WebSocket v5 @ 127.0.0.1:4455)
[OBS Studio (Escenas / Filtros / Audio)]
```

---

## 🛠️ Guía de Instalación Rápida

### 1. Activar el Servidor WebSocket en Streamer.bot
1. Abre **Streamer.bot**.
2. Dirígete a la pestaña **Servers/Clients** > subpestaña **Websocket Server**.
3. Asegúrate de que los siguientes valores estén configurados:
   - **Host:** `127.0.0.1` (o `0.0.0.0`)
   - **Port:** `8080`
   - **Endpoint:** `/`
   - **Auto Start:** Activado (marcado)
4. Haz clic en **Start Server**. El estado debe mostrar `Open`.

---

### 2. Importar Acciones Preconfiguradas
Puedes importar el paquete completo de acciones de Hectron:
1. En Streamer.bot, haz clic en el botón **Import** en la barra superior.
2. Copia y pega el contenido del archivo `export/hectron_streamerbot_import.sb`.
3. Haz clic en **Import**.
4. Verás las siguientes acciones disponibles:
   - `Hectron_TikTok_Gift`: Reacción a regalos (Rosas, Coronas, etc.) y cambio dinámico de escenas OBS.
   - `Hectron_TikTok_Chat`: Procesamiento de preguntas del chat con Gemini AI + TTS.
   - `Hectron_TikTok_Follow`: Alertas de seguidores y efectos de sonido.
   - `Hectron_SendChatbotMessage`: Emisión de respuestas generadas por IA hacia el overlay.

---

### 3. Código C# Personalizado (Execute C# Code)
Si configuras las acciones manualmente, usa los scripts ubicados en la carpeta `actions/`:
- `actions/TikTokGiftAction.cs`
- `actions/TikTokCommentAction.cs`
- `actions/TikTokFollowAction.cs`
- `actions/ChatbotResponseAction.cs`

---

## 📡 Ejecutar el Puente Local (Bridge opcional)
Si deseas ejecutar un puente autónomo en segundo plano que sincronice el WebSocket de Streamer.bot con HECTRON Server:

```bash
npm run streamerbot:bridge
```
O directamente con Node:
```bash
node Streamer.bot/scripts/bridge.js
```
