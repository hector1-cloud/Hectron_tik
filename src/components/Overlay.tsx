import { useContext, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { BrainContext } from "../BrainContext";
import { HectronCloud } from "./HectronCloud";
import { Particles, Glow, TransitionEffect, Bubbles } from "./Effects";
import { Sparkles, Radio, Volume2, MessageSquare } from "lucide-react";

export function Overlay() {
  const { emotion, obsStatus, messages, latestSpeechText, isSpeaking } = useContext(BrainContext);
  const [transitioning, setTransitioning] = useState(false);

  const lastAiMessage = messages.filter((m) => m.isAi).slice(-1)[0];

  useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => setTransitioning(false), 800);
    return () => clearTimeout(timer);
  }, [emotion]);

  return (
    <div className="relative w-full h-screen bg-slate-950/90 overflow-hidden select-none font-sans">
      {/* 3D Canvas Background & Character */}
      <div className="absolute inset-0 z-0">
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 1.2, 3.8], fov: 48 }}
          style={{ width: "100%", height: "100%" }}
        >
          <color attach="background" args={["#0a0e1a"]} />

          {/* Ambient Lighting */}
          <ambientLight intensity={0.6} color="#00e1ff" />

          {/* FX Layer */}
          <Particles count={450} color="#00ffff" />
          <Glow color="#00ffff" intensity={1.4} position={[0, 2, 0]} />
          <TransitionEffect active={transitioning} color="#00ffff" />
          <Bubbles emotion={emotion} count={18} />

          {/* 3D Miku Avatar */}
          <HectronCloud emotion={emotion} isSpeaking={isSpeaking} />
        </Canvas>
      </div>

      {/* Top Floating Stream Badge */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-full shadow-lg shadow-cyan-500/10">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-300 font-bold tracking-wider text-sm">HECTRON STREAMER STUDIO</span>
          <span className="text-xs text-slate-400 border-l border-slate-700 pl-2">Miku v3.2</span>
        </div>

        <div className="flex items-center gap-3">
          {obsStatus.streaming ? (
            <div className="flex items-center gap-2 bg-red-600/90 text-white font-bold text-xs px-3 py-1.5 rounded-full animate-pulse shadow-lg shadow-red-500/30">
              <Radio className="w-4 h-4" />
              <span>● LIVE TO TIKTOK</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800/80 text-slate-400 font-medium text-xs px-3 py-1.5 rounded-full border border-slate-700">
              <Radio className="w-4 h-4" />
              <span>OFFLINE</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-full text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{emotion}</span>
          </div>
        </div>
      </div>

      {/* Bottom Subtitle / Speech Bubble Overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl z-10 pointer-events-none">
        {(latestSpeechText || lastAiMessage) && (
          <div className="bg-slate-900/90 border-2 border-cyan-400/60 backdrop-blur-xl p-5 rounded-2xl shadow-2xl shadow-cyan-500/20 text-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> HECTRON (Miku)
              </span>
              {isSpeaking && (
                <span className="flex items-center gap-1 text-xs text-pink-400 animate-pulse font-semibold">
                  <Volume2 className="w-3.5 h-3.5" /> Hablando...
                </span>
              )}
            </div>
            <p className="text-white text-lg font-medium leading-relaxed drop-shadow">
              "{latestSpeechText || lastAiMessage?.text}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
