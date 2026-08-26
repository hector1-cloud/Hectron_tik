using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        // Extrae variables enviadas por HECTRON Studio
        string user = CPH.GetGlobalVar<string>("hectron_gift_user", false) ?? "Fan";
        string giftName = CPH.GetGlobalVar<string>("hectron_gift_name", false) ?? "Rose";
        int count = CPH.GetGlobalVar<int>("hectron_gift_count", false);
        if (count <= 0) count = 1;

        CPH.LogInfo($"[HECTRON Streamer.bot] TikTok Gift recibido: {count}x {giftName} de {user}");

        // Lógica reactiva de cambio de escena OBS según el regalo
        string normalized = giftName.ToLower();
        if (normalized.Contains("rose") || normalized.Contains("rosa"))
        {
            CPH.ObsSetCurrentScene("FLIRT_SCENE");
            CPH.PlaySound(@"C:\Windows\Media\tada.wav", 1.0f);
        }
        else if (normalized.Contains("crown") || normalized.Contains("corona"))
        {
            CPH.ObsSetCurrentScene("SURPRISE_SCENE");
            CPH.PlaySound(@"C:\Windows\Media\chimes.wav", 1.0f);
        }
        else if (normalized.Contains("dumbbell") || normalized.Contains("pesa"))
        {
            CPH.ObsSetCurrentScene("HAPPY_SCENE");
        }
        else
        {
            CPH.ObsSetCurrentScene("DEFAULT");
        }

        // Emite confirmación de evento vía WebSocket a Hectron Overlay
        var payload = new
        {
            action = "onGiftProcessed",
            user = user,
            giftName = giftName,
            count = count,
            timestamp = DateTime.UtcNow.ToString("o")
        };

        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(payload));
        return true;
    }
}
