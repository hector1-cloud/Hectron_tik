using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        string username = CPH.GetGlobalVar<string>("hectron_chat_user", false) ?? "Viewer";
        string message = CPH.GetGlobalVar<string>("hectron_chat_text", false) ?? "";

        if (string.IsNullOrWhiteSpace(message))
        {
            return true;
        }

        CPH.LogInfo($"[HECTRON Streamer.bot] TikTok Chat de {username}: {message}");

        // Reenvía el mensaje al sintetizador o Gemini AI si comienza con comando
        if (message.StartsWith("!pregunta") || message.StartsWith("!ai"))
        {
            var promptPayload = new
            {
                action = "processAiPrompt",
                user = username,
                prompt = message.Replace("!pregunta", "").Replace("!ai", "").Trim()
            };
            CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(promptPayload));
        }

        return true;
    }
}
