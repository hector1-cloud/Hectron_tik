using System;
using Newtonsoft.Json;

public class CPHInline
{
    public bool Execute()
    {
        string follower = CPH.GetGlobalVar<string>("hectron_follower_user", false) ?? "Nuevo Seguidor";

        CPH.LogInfo($"[HECTRON Streamer.bot] Nuevo seguidor en directo: {follower}");

        // Activa fuente de animación o sonido en OBS
        CPH.ObsSetSourceVisibility("DEFAULT", "FollowerAlertOverlay", true);
        CPH.Wait(3000);
        CPH.ObsSetSourceVisibility("DEFAULT", "FollowerAlertOverlay", false);

        var followPayload = new
        {
            action = "onFollowerProcessed",
            user = follower,
            coinsReward = 50,
            expReward = 25
        };

        CPH.WebsocketBroadcastJson(JsonConvert.SerializeObject(followPayload));
        return true;
    }
}
