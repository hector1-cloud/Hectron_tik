import React, { useState, useEffect } from "react";
import {
  GitFork,
  Play,
  Copy,
  Check,
  Code2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Zap,
  RotateCcw,
  Layers,
  ArrowRight,
  Database,
  Cpu
} from "lucide-react";

interface WorkflowStepExecution {
  stepName: string;
  type: "do" | "sleep";
  status: "pending" | "running" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  output?: any;
}

interface WorkflowInstance {
  id: string;
  workflowName: string;
  status: "queued" | "running" | "completed" | "failed";
  payload: any;
  currentStepIndex: number;
  steps: WorkflowStepExecution[];
  createdAt: string;
  updatedAt: string;
  result?: any;
  error?: string;
}

export const CloudflareWorkflowsRunner: React.FC = () => {
  const [workflowType, setWorkflowType] = useState<"hello-world" | "streamer-automation" | "ai-pipeline">("hello-world");
  const [userName, setUserName] = useState<string>("Hectron");
  const [customPayloadJson, setCustomPayloadJson] = useState<string>('{\n  "name": "Hectron",\n  "streamId": "live_stream_992",\n  "autonomyLevel": "HIGH"\n}');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedInstanceJson, setCopiedInstanceJson] = useState<boolean>(false);

  const cliCommand = "npm create cloudflare@latest -- --type=hello-world-workflows";

  const workflowCodeSnippets: Record<string, string> = {
    "hello-world": `import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

type Env = {
  AI: any;
};

type Params = {
  name: string;
  streamId?: string;
};

export class HelloWorldWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    // Step 1: Durable Task - Initialize Session
    const step1 = await step.do('initialize-session', async () => {
      return {
        status: 'initialized',
        user: event.payload.name || 'World',
        timestamp: new Date().toISOString()
      };
    });

    // Step 2: Durable Sleep - Simulate asynchronous delay or timer
    await step.sleep('wait-for-cooldown', '3 seconds');

    // Step 3: Durable Task - Execute AI Greeting & Finalize
    const step2 = await step.do('generate-greeting', async () => {
      return {
        greeting: \`Hello \${event.payload.name || 'World'}, welcome to Cloudflare Workflows!\`,
        session: step1,
        completedAt: new Date().toISOString()
      };
    });

    return step2;
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Trigger or inspect workflow status
    return new Response('Cloudflare Workflows Active');
  }
};`,

    "streamer-automation": `import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class StreamerAutomationWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent, step: WorkflowStep) {
    // Step 1: Check Streamer Online Status
    const status = await step.do('check-stream-status', async () => {
      return { online: true, platform: 'TikTok LIVE', viewers: 1420 };
    });

    // Step 2: Durable Cooldown Period
    await step.sleep('stream-warmup-delay', '5 seconds');

    // Step 3: Trigger AI Brain Commentary
    const commentary = await step.do('trigger-brain-commentary', async () => {
      return {
        action: 'SPEAK_GREETING',
        text: '¡Hola a todos en el directo de TikTok! HECTRON IA está listo.',
        emotion: 'EXCITED'
      };
    });

    return { status, commentary };
  }
}`,

    "ai-pipeline": `import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';

export class AiPipelineWorkflow extends WorkflowEntrypoint {
  async run(event: WorkflowEvent, step: WorkflowStep) {
    // Step 1: Analyze Input Prompt
    const promptAnalysis = await step.do('analyze-prompt', async () => {
      return { intent: 'GREETING', priority: 'HIGH', tokenLength: 42 };
    });

    // Step 2: Durable Pause for Model Inference Buffer
    await step.sleep('inference-throttling-buffer', '2 seconds');

    // Step 3: Store State in Durable Storage
    const storageState = await step.do('persist-state', async () => {
      return { savedToDatabase: true, recordId: \`rec_\${Date.now()}\` };
    });

    return { promptAnalysis, storageState };
  }
}`
  };

  // Fetch Workflow instances from backend
  const fetchInstances = async () => {
    try {
      const res = await fetch("/api/workflows/instances");
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
        if (data.length > 0 && !selectedInstanceId) {
          setSelectedInstanceId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching workflows:", e);
    }
  };

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerWorkflow = async () => {
    setLoading(true);
    let parsedPayload = { name: userName };
    try {
      parsedPayload = JSON.parse(customPayloadJson);
    } catch (e) {
      parsedPayload = { name: userName };
    }

    try {
      const res = await fetch("/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowName: workflowType,
          payload: parsedPayload
        })
      });

      if (res.ok) {
        const newInstance = await res.json();
        setSelectedInstanceId(newInstance.id);
        await fetchInstances();
      }
    } catch (err) {
      console.error("Trigger workflow error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeInstance = instances.find((i) => i.id === selectedInstanceId) || instances[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border border-cyan-500/30 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30">
              <GitFork className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white tracking-wide">
              Cloudflare Workflows Engine
            </h2>
            <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 font-mono text-[11px] rounded-full border border-cyan-500/40 font-bold">
              hello-world-workflows
            </span>
          </div>
          <p className="text-slate-400 text-xs max-w-2xl">
            Motor de ejecución durable con la API <code className="text-cyan-300 font-mono">WorkflowEntrypoint</code>. Maneja reintentos automáticos, pausas durables (`step.sleep`) y puntos de control de estado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerWorkflow}
            disabled={loading}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/40 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
            )}
            <span>{loading ? "Iniciando Workflow..." : "Ejecutar Workflow"}</span>
          </button>
        </div>
      </div>

      {/* CLI Command Quick-Start Card */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Terminal className="w-5 h-5 text-orange-400 shrink-0" />
          <div className="font-mono text-xs text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 w-full sm:w-auto overflow-x-auto">
            <span className="text-slate-500">$ </span>
            <span className="text-cyan-300">{cliCommand}</span>
          </div>
        </div>

        <button
          onClick={() => copyToClipboard(cliCommand, setCopiedCli)}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer shrink-0 border border-slate-700"
        >
          {copiedCli ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copiedCli ? "Comando Copiado" : "Copiar Comando C3"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code & Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Preset Selector */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Seleccionar Plantilla de Workflow
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setWorkflowType("hello-world")}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition text-center cursor-pointer ${
                  workflowType === "hello-world"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                Hello World
              </button>

              <button
                onClick={() => setWorkflowType("streamer-automation")}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition text-center cursor-pointer ${
                  workflowType === "streamer-automation"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                Streamer Bot
              </button>

              <button
                onClick={() => setWorkflowType("ai-pipeline")}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold border transition text-center cursor-pointer ${
                  workflowType === "ai-pipeline"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                AI Pipeline
              </button>
            </div>

            {/* Custom Payload */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-slate-400 font-medium text-xs mb-1">
                Event Payload JSON (`event.payload`)
              </label>
              <textarea
                value={customPayloadJson}
                onChange={(e) => setCustomPayloadJson(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-2.5 font-mono text-xs focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          {/* Workflow Source Code */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-400" />
                src/index.ts (Workflow Entrypoint)
              </span>
              <button
                onClick={() => copyToClipboard(workflowCodeSnippets[workflowType], setCopiedCode)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-md flex items-center gap-1 transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copiado" : "Copiar TS"}</span>
              </button>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300 max-h-80">
              <pre>{workflowCodeSnippets[workflowType]}</pre>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Engine Monitor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Execution Canvas */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-5 shadow-lg min-h-[480px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">
                  Monitor de Instancia de Workflow
                </span>
                {activeInstance && (
                  <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono rounded">
                    ID: {activeInstance.id.substring(0, 12)}...
                  </span>
                )}
              </div>

              {activeInstance && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border flex items-center gap-1 ${
                      activeInstance.status === "completed"
                        ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                        : activeInstance.status === "running"
                        ? "bg-cyan-950 text-cyan-300 border-cyan-500/40 animate-pulse"
                        : "bg-slate-900 text-slate-400 border-slate-800"
                    }`}
                  >
                    {activeInstance.status === "running" && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {activeInstance.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                    <span>{activeInstance.status.toUpperCase()}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Workflow Step Flow Visualizer */}
            {activeInstance ? (
              <div className="space-y-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Línea de Tiempo de Pasos Durables (`step.do` & `step.sleep`)</span>
                    <span className="text-cyan-400 font-mono">
                      Paso {activeInstance.currentStepIndex + 1} de {activeInstance.steps.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeInstance.steps.map((step, sIdx) => {
                      const isCurrent = sIdx === activeInstance.currentStepIndex;
                      const isCompleted = step.status === "completed";
                      const isRunning = step.status === "running";

                      return (
                        <div
                          key={sIdx}
                          className={`p-3 rounded-lg border transition-all ${
                            isRunning
                              ? "bg-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                              : isCompleted
                              ? "bg-slate-950/80 border-emerald-500/30"
                              : "bg-slate-950/30 border-slate-800/80 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full font-mono text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  isCompleted
                                    ? "bg-emerald-500 text-slate-950"
                                    : isRunning
                                    ? "bg-cyan-400 text-slate-950 animate-pulse"
                                    : "bg-slate-800 text-slate-400"
                                }`}
                              >
                                {sIdx + 1}
                              </span>

                              <div>
                                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                                  <span>{step.stepName}</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono ${
                                      step.type === "sleep"
                                        ? "bg-purple-950 text-purple-300 border border-purple-500/30"
                                        : "bg-blue-950 text-blue-300 border border-blue-500/30"
                                    }`}
                                  >
                                    {step.type === "sleep" ? "step.sleep()" : "step.do()"}
                                  </span>
                                </div>
                                {step.startedAt && (
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    Iniciado: {new Date(step.startedAt).toLocaleTimeString()}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right font-mono text-[11px]">
                              {isRunning && step.type === "sleep" && (
                                <span className="text-purple-300 font-bold flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3.5 h-3.5" /> En Pausa Durable...
                                </span>
                              )}
                              {isRunning && step.type === "do" && (
                                <span className="text-cyan-300 font-bold flex items-center gap-1 animate-spin">
                                  <RefreshCw className="w-3.5 h-3.5" /> Ejecutando...
                                </span>
                              )}
                              {isCompleted && (
                                <span className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> OK ({step.durationMs || 120}ms)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Step Output Box */}
                          {step.output && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded">
                              <span className="text-[9px] text-slate-500 block uppercase font-bold mb-1">
                                Step Output Checkpoint:
                              </span>
                              <pre className="whitespace-pre-wrap">{JSON.stringify(step.output, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Final Workflow Result */}
                {activeInstance.result && (
                  <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Resultado Final del Workflow (`return step2`)
                      </span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(activeInstance.result, null, 2), setCopiedInstanceJson)}
                        className="px-2 py-1 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-200 text-[10px] font-bold rounded flex items-center gap-1 transition"
                      >
                        {copiedInstanceJson ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedInstanceJson ? "Copiado" : "Copiar JSON"}</span>
                      </button>
                    </div>
                    <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-200 overflow-x-auto">
                      {JSON.stringify(activeInstance.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 text-xs">
                <GitFork className="w-10 h-10 mb-2 opacity-30 text-cyan-400" />
                Haz clic en "Ejecutar Workflow" para iniciar una nueva instancia durable.
              </div>
            )}
          </div>

          {/* Workflow Instances History Table */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                Historial de Instancias Durables
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {instances.length} Instancias Registradas
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {instances.map((inst) => (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInstanceId(inst.id)}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between cursor-pointer transition ${
                    inst.id === selectedInstanceId
                      ? "bg-cyan-950/50 border-cyan-500/50 text-cyan-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span className="font-bold text-slate-200">{inst.id.substring(0, 10)}...</span>
                    <span className="text-slate-500 text-[10px]">({inst.workflowName})</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">
                      {new Date(inst.createdAt).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        inst.status === "completed"
                          ? "bg-emerald-950 text-emerald-400"
                          : "bg-cyan-950 text-cyan-300"
                      }`}
                    >
                      {inst.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
