import React, { useState, useEffect } from "react";
import {
  Cpu,
  Play,
  Copy,
  Check,
  Code2,
  Sparkles,
  RefreshCw,
  Terminal,
  Zap,
  CheckCircle2,
  Bot,
  MessageSquare
} from "lucide-react";

interface TaskResult {
  inputs: any;
  response: {
    result?: { response?: string };
    success?: boolean;
    model?: string;
    execution_time_ms?: number;
    error?: string;
  };
}

export const WorkersAiRunner: React.FC = () => {
  const [model, setModel] = useState<string>("@cf/meta/llama-3-8b-instruct");
  const [simplePrompt, setSimplePrompt] = useState<string>("Tell me a joke about Cloudflare");
  const [chatPrompt, setChatPrompt] = useState<string>("Who won the world series in 2020?");
  const [systemInstruction, setSystemInstruction] = useState<string>("You are a helpful assistant.");

  const [loading, setLoading] = useState<boolean>(false);
  const [tasksResults, setTasksResults] = useState<TaskResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null);

  const workerCodeSnippet = `export default {
  async fetch(request, env) {
    const tasks = [];

    // prompt - simple completion style input
    let simple = {
      prompt: '${simplePrompt.replace(/'/g, "\\'")}'
    };
    let response = await env.AI.run('${model}', simple);
    tasks.push({ inputs: simple, response });

    // messages - chat style input
    let chat = {
      messages: [
        { role: 'system', content: '${systemInstruction.replace(/'/g, "\\'")}' },
        { role: 'user', content: '${chatPrompt.replace(/'/g, "\\'")}' }
      ]
    };
    response = await env.AI.run('${model}', chat);
    tasks.push({ inputs: chat, response });

    return Response.json(tasks);
  }
};`;

  const runWorkerTasks = async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const res = await fetch("/api/workers-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          prompt: simplePrompt,
          chat_prompt: chatPrompt,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: chatPrompt }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setTasksResults(data);
      setLastExecutionTime(Math.round(performance.now() - startTime));
    } catch (err: any) {
      setError(err?.message || "Error al ejecutar las tareas de Workers AI");
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on first mount
  useEffect(() => {
    runWorkerTasks();
  }, []);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurlCommand = () => {
    const origin = window.location.origin;
    return `curl -X POST "${origin}/api/workers-ai" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model}",
    "prompt": "${simplePrompt}",
    "chat_prompt": "${chatPrompt}"
  }'`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-950/80 via-slate-900 to-slate-950 border border-orange-500/30 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-black text-white tracking-wide">
              Cloudflare Workers AI Task Runner
            </h2>
            <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-300 font-mono text-[11px] rounded-full border border-orange-500/40 font-bold">
              @cf/meta/llama-3-8b-instruct
            </span>
          </div>
          <p className="text-slate-400 text-xs max-w-2xl">
            Ejecuta funciones de servidor Edge con Cloudflare Workers AI y modelos Llama-3 de baja latencia. Soporta tanto entradas de completado simple (`prompt`) como conversaciones estructuradas (`messages`).
          </p>
        </div>

        <button
          onClick={runWorkerTasks}
          disabled={loading}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-orange-300/40 shrink-0"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
          )}
          <span>{loading ? "Ejecutando Tareas..." : "Ejecutar Workers AI"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Editor & Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Controls Card */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-orange-400" />
                Configuración del Modelo y Prompts
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Modelo Cloudflare AI
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono text-xs focus:border-orange-500 outline-none"
                >
                  <option value="@cf/meta/llama-3-8b-instruct">@cf/meta/llama-3-8b-instruct (Recomendado)</option>
                  <option value="@cf/meta/llama-2-7b-chat-fp16">@cf/meta/llama-2-7b-chat-fp16</option>
                  <option value="@cf/mistral/mistral-7b-instruct-v0.1">@cf/mistral/mistral-7b-instruct-v0.1</option>
                </select>
              </div>

              {/* Simple Prompt */}
              <div>
                <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span>Input 1: Simple Completion (`prompt`)</span>
                  <span className="text-[10px] text-orange-400 font-mono">string</span>
                </label>
                <input
                  type="text"
                  value={simplePrompt}
                  onChange={(e) => setSimplePrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono text-xs focus:border-orange-500 outline-none"
                  placeholder="Tell me a joke about Cloudflare"
                />
              </div>

              {/* Chat Messages Input */}
              <div className="space-y-2 border-t border-slate-800/80 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-medium flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    Input 2: Chat Array (`messages`)
                  </label>
                  <span className="text-[10px] text-cyan-400 font-mono">Array&lt;Message&gt;</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase">System Context</span>
                  <input
                    type="text"
                    value={systemInstruction}
                    onChange={(e) => setSystemInstruction(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono text-xs focus:border-cyan-500 outline-none mt-0.5"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase">User Question</span>
                  <input
                    type="text"
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono text-xs focus:border-cyan-500 outline-none mt-0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Code Snippet Card */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                <Code2 className="w-4 h-4 text-orange-400" />
                Worker Code (index.js)
              </span>
              <button
                onClick={() => copyToClipboard(workerCodeSnippet, setCopiedCode)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-md flex items-center gap-1 transition cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copiado" : "Copiar Código"}</span>
              </button>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-300 max-h-72">
              <pre>{workerCodeSnippet}</pre>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Output & JSON Tasks (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Output Card */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4 shadow-md min-h-[500px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold text-slate-200">
                  Respuesta de Tareas (`Response.json(tasks)`)
                </span>
                {lastExecutionTime && (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded">
                    {lastExecutionTime} ms
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(getCurlCommand(), setCopiedCurl)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-bold rounded-lg border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Terminal className="w-3 h-3 text-orange-400" />}
                  <span>{copiedCurl ? "cURL Copiado" : "Copiar cURL"}</span>
                </button>

                <button
                  onClick={() => copyToClipboard(JSON.stringify(tasksResults, null, 2), setCopiedJson)}
                  disabled={!tasksResults}
                  className="px-2.5 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold rounded-lg border border-orange-500/30 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? "JSON Copiado" : "Copiar JSON"}</span>
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-950/60 border border-red-500/40 p-4 rounded-lg text-xs text-red-300 font-mono">
                ⚠️ Error: {error}
              </div>
            )}

            {/* Results Display */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
                <p className="text-xs text-slate-400 font-mono">
                  Procesando inferencia con {model}...
                </p>
              </div>
            ) : tasksResults && tasksResults.length > 0 ? (
              <div className="space-y-4 flex-1">
                {/* Task Cards */}
                {tasksResults.map((task, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5 font-mono">
                        <Bot className="w-4 h-4" />
                        Task #{idx + 1}: {idx === 0 ? "Simple Completion (`prompt`)" : "Chat Array (`messages`)"}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/30">
                        200 OK
                      </span>
                    </div>

                    {/* Inputs */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Entradas (`inputs`)
                      </span>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 font-mono text-[11px] text-slate-300">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(task.inputs, null, 2)}</pre>
                      </div>
                    </div>

                    {/* Output */}
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        Respuesta del Modelo (`response`)
                      </span>
                      <div className="bg-slate-950 p-3 rounded-lg border border-orange-500/20 font-sans text-xs text-slate-100 leading-relaxed space-y-1">
                        <p className="font-medium text-slate-200">
                          {task.response?.result?.response || JSON.stringify(task.response)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Raw JSON Accordion */}
                <details className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-xs">
                  <summary className="font-mono text-slate-400 cursor-pointer font-bold hover:text-slate-200">
                    Ver Respuesta JSON Raw Estructurada (`Array&lt;Task&gt;`)
                  </summary>
                  <pre className="mt-3 bg-slate-950 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
                    {JSON.stringify(tasksResults, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
                Haz clic en "Ejecutar Workers AI" para ejecutar las tareas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
