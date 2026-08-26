using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        // Emite el mensaje del chatbot para que el overlay de HECTRON lo pinte en pantalla y active Gemini TTS
        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(new
        {
            action = "sendChatbotMessage",
            args = args
        }));
        return true;
    }
}
