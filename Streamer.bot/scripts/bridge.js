/**
 * HECTRON Streamer.bot Bridge
 * Connects Streamer.bot WebSocket Server (127.0.0.1:8080) with HECTRON Brain Server.
 */

import { WebSocket } from 'ws';

const STREAMERBOT_WS_URL = process.env.STREAMERBOT_WS_URL || 'ws://127.0.0.1:8080/';
const HECTRON_WS_URL = process.env.HECTRON_WS_URL || 'ws://127.0.0.1:3000/api/brain/ws';

console.log('🤖 Starting HECTRON <-> Streamer.bot WebSocket Bridge...');
console.log(`- Streamer.bot URL: ${STREAMERBOT_WS_URL}`);
console.log(`- HECTRON Brain URL: ${HECTRON_WS_URL}`);

let sbWs = null;
let hectronWs = null;

function connectStreamerbot() {
  try {
    sbWs = new WebSocket(STREAMERBOT_WS_URL);

    sbWs.on('open', () => {
      console.log('✅ Connected to Streamer.bot WebSocket server (8080)');
      // Subscribe to all actions / events
      sbWs.send(JSON.stringify({
        request: 'Subscribe',
        id: 'hectron-bridge-sub',
        events: {
          General: ['Custom'],
          Twitch: ['ChatMessage'],
          YouTube: ['Message']
        }
      }));
    });

    sbWs.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        console.log('[Streamer.bot -> HECTRON]', payload);
        if (hectronWs && hectronWs.readyState === WebSocket.OPEN) {
          hectronWs.send(JSON.stringify({
            type: 'streamerbot_event',
            data: payload
          }));
        }
      } catch (err) {
        console.error('Error parsing Streamer.bot message:', err.message);
      }
    });

    sbWs.on('close', () => {
      console.warn('⚠️ Streamer.bot connection closed. Reconnecting in 5s...');
      setTimeout(connectStreamerbot, 5000);
    });

    sbWs.on('error', (err) => {
      console.error('❌ Streamer.bot WebSocket error:', err.message);
    });
  } catch (err) {
    console.error('Error creating Streamer.bot connection:', err);
    setTimeout(connectStreamerbot, 5000);
  }
}

function connectHectron() {
  try {
    hectronWs = new WebSocket(HECTRON_WS_URL);

    hectronWs.on('open', () => {
      console.log('✅ Connected to HECTRON Brain WebSocket server (3000)');
    });

    hectronWs.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        // Forward TikTok Gift / Comment to Streamer.bot Actions
        if (payload.type === 'tiktok_gift' && sbWs && sbWs.readyState === WebSocket.OPEN) {
          console.log('[HECTRON -> Streamer.bot] Firing TikTokGiftAction');
          sbWs.send(JSON.stringify({
            request: 'DoAction',
            action: { name: 'Hectron_TikTok_Gift' },
            args: {
              hectron_gift_user: payload.user || 'Fan',
              hectron_gift_name: payload.giftName || 'Rose',
              hectron_gift_count: payload.count || 1
            },
            id: 'hectron-gift-' + Date.now()
          }));
        } else if (payload.type === 'tiktok_comment' && sbWs && sbWs.readyState === WebSocket.OPEN) {
          console.log('[HECTRON -> Streamer.bot] Firing TikTokCommentAction');
          sbWs.send(JSON.stringify({
            request: 'DoAction',
            action: { name: 'Hectron_TikTok_Chat' },
            args: {
              hectron_chat_user: payload.user || 'Viewer',
              hectron_chat_text: payload.text || ''
            },
            id: 'hectron-chat-' + Date.now()
          }));
        }
      } catch (err) {
        console.error('Error forwarding Hectron message to Streamer.bot:', err.message);
      }
    });

    hectronWs.on('close', () => {
      console.warn('⚠️ HECTRON Brain connection closed. Reconnecting in 5s...');
      setTimeout(connectHectron, 5000);
    });

    hectronWs.on('error', (err) => {
      console.error('❌ HECTRON Brain WebSocket error:', err.message);
    });
  } catch (err) {
    console.error('Error creating HECTRON connection:', err);
    setTimeout(connectHectron, 5000);
  }
}

connectStreamerbot();
connectHectron();
