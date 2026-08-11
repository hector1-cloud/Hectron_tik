import { useContext } from "react";
import { BrainContext } from "../BrainContext";
import { Layers, Check } from "lucide-react";

export function SceneSelector() {
  const { scenes, obsStatus, setObsStatus, agentUrl, setEmotion } = useContext(BrainContext);

  const defaultScenes = [
    { name: "DEFAULT", emotion: "IDLE", icon: "✨" },
    { name: "HAPPY_SCENE", emotion: "HAPPY", icon: "😄" },
    { name: "FLIRT_SCENE", emotion: "FLIRT", icon: "💖" },
    { name: "SURPRISE_SCENE", emotion: "SURPRISE", icon: "😮" },
    { name: "SAD_SCENE", emotion: "SAD", icon: "🥺" },
    { name: "ANGRY_SCENE", emotion: "ANGRY", icon: "😡" },
  ];

  const availableScenes = scenes.length > 0 ? scenes.map((s) => ({ name: s, emotion: "IDLE", icon: "🎭" })) : defaultScenes;

  const handleSceneSelect = async (sceneName: string, emotionTag?: string) => {
    setObsStatus({ ...obsStatus, scene: sceneName });
    if (emotionTag) {
      setEmotion(emotionTag as any);
    }

    if (agentUrl) {
      try {
        await fetch(`${agentUrl}/scene`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Agent-Token": "default_token",
          },
          body: JSON.stringify({ scene: sceneName }),
        });
      } catch (err) {
        console.warn("Local agent scene trigger demo:", err);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">🎭 Selector de Escenas OBS</h2>
        </div>
        <span className="text-xs text-slate-400">
          Escena actual: <strong className="text-cyan-400">{obsStatus.scene || "DEFAULT"}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {availableScenes.map((item) => {
          const isActive = obsStatus.scene === item.name;
          return (
            <button
              key={item.name}
              onClick={() => handleSceneSelect(item.name, item.emotion)}
              className={`flex items-center justify-between p-3 rounded-lg border text-xs font-semibold transition cursor-pointer text-left ${
                isActive
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10"
                  : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span>{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </span>
              {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
