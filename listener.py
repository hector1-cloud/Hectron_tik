import asyncio
import aiohttp
from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, CommentEvent, GiftEvent

# ==========================================
# CONFIGURACIÓN DEL SISTEMA
# ==========================================
TIKTOK_USERNAME = "@tu_usuario_de_tiktok" # El perfil que está transmitiendo
VERCEL_ENDPOINT = "https://hectron-streamer-studio.ai.studio/api/chat" # URL ajustada a tu instancia en AI Studio

# Inicializar cliente
client = TikTokLiveClient(unique_id=TIKTOK_USERNAME)

# ==========================================
# PUENTE DE COMUNICACIÓN CON VERCEL
# ==========================================
async def enviar_a_vercel(payload):
    """Envía el JSON al endpoint serverless de forma asíncrona"""
    async with aiohttp.ClientSession() as session:
        try:
            # POST hacia Vercel/AI Studio
            async with session.post(VERCEL_ENDPOINT, json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    # Aquí recibes la respuesta de Hectron-01 generada en la nube
                    respuesta_ia = data.get("respuesta", "")
                    print(f"\n[Hectron-01]: {respuesta_ia}\n")
                    
                    # TODO: Aquí puedes enviar 'respuesta_ia' a un generador TTS local
                else:
                    print(f"[Error Vercel]: Código HTTP {response.status}")
        except Exception as e:
            print(f"[Falla de Red]: No se pudo contactar a Vercel. {e}")

# ==========================================
# INTERCEPCIÓN DE EVENTOS DE TIKTOK
# ==========================================
@client.on(ConnectEvent)
async def on_connect(event: ConnectEvent):
    print(f"[*] Enlace establecido con el directo de {event.unique_id}")

@client.on(CommentEvent)
async def on_comment(event: CommentEvent):
    # Imprimir en terminal para monitoreo visual
    print(f"[Chat] {event.user.nickname}: {event.comment}")
    
    # Filtro de Autonomía: Solo procesar si el usuario invoca al sistema
    if "!hectron" in event.comment.lower():
        payload = {
            "usuario": event.user.nickname,
            "evento": "comentario",
            "mensaje": event.comment,
            "regalo": None
        }
        # Crear tarea en segundo plano para no bloquear el chat
        asyncio.create_task(enviar_a_vercel(payload))

@client.on(GiftEvent)
async def on_gift(event: GiftEvent):
    # Evitar spam de regalos en racha (solo procesar el primero o el total)
    if not event.streaking or event.streak_count == 1:
        print(f"[Regalo] {event.user.nickname} ha enviado {event.gift.name}")
        payload = {
            "usuario": event.user.nickname,
            "evento": "regalo",
            "mensaje": "",
            "regalo": event.gift.name
        }
        asyncio.create_task(enviar_a_vercel(payload))

# ==========================================
# ARRANQUE
# ==========================================
if __name__ == '__main__':
    print("[*] Iniciando Listener Hectron-01...")
    client.run()
