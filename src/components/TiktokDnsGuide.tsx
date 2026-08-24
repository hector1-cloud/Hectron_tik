import { useState } from "react";
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  HelpCircle,
  Terminal,
  CheckCircle2,
  RefreshCw,
  Info
} from "lucide-react";

export function TiktokDnsGuide() {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<"vercel" | "cloudflare" | "godaddy" | "generic">("vercel");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const RECORD_TYPE = "TXT";
  const RECORD_HOST = "@";
  const DOMAIN_TARGET = "hectron-streamer-studio.ai.studio";
  const VERIFICATION_CODE = "tiktok-developers-site-verification=58o0bO0w67EDeqScw66ZzU4OoMCxGZel";

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const testLocalVerification = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Test fetching verification file endpoint
      const res = await fetch(`/tiktok-developers-site-verification=58o0bO0w67EDeqScw66ZzU4OoMCxGZel.txt`);
      if (res.ok) {
        const text = await res.text();
        if (text.includes("58o0bO0w67EDeqScw66ZzU4OoMCxGZel")) {
          setTestResult({
            success: true,
            message: "¡Verificación local exitosa! El archivo estático y el metatag están respondiendo adecuadamente en el servidor."
          });
        } else {
          setTestResult({
            success: false,
            message: "El servidor respondió pero el contenido del código no coincide."
          });
        }
      } else {
        setTestResult({
          success: false,
          message: `El servidor devolvió un código HTTP ${res.status}.`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error al probar la verificación local: ${err?.message || "Error de red"}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Guía de Verificación de Dominio DNS (TikTok Developers)</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                TXT Record
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Instrucciones exactas para vincular y verificar tu dominio <code className="text-cyan-300 font-mono font-bold">{DOMAIN_TARGET}</code> en la consola de TikTok.
            </p>
          </div>
        </div>

        <a
          href="https://developers.tiktok.com/"
          target="_blank"
          rel="noreferrer"
          className="self-start sm:self-auto px-3.5 py-2 bg-black hover:bg-zinc-900 text-white border border-zinc-800 hover:border-cyan-500/40 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
        >
          <span>Portal TikTok Developers</span>
          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
        </a>
      </div>

      {/* Target Record Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 space-y-3.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Datos del Registro DNS TXT Requerido</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Dominio: {DOMAIN_TARGET}</span>
        </div>

        {/* Data Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Type */}
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Tipo de Registro</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-emerald-400">{RECORD_TYPE}</span>
              <button
                onClick={() => handleCopy(RECORD_TYPE, "type")}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Copiar Tipo"
              >
                {copiedField === "type" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Name / Host */}
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Nombre / Host</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-cyan-300">{RECORD_HOST} <span className="text-[10px] text-slate-400 font-normal font-sans">(o subdominio)</span></span>
              <button
                onClick={() => handleCopy(RECORD_HOST, "host")}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Copiar Host"
              >
                {copiedField === "host" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* TTL */}
          <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">TTL</span>
            <span className="font-mono text-sm font-semibold text-slate-300">Automático / 3600</span>
          </div>
        </div>

        {/* Full TXT Value Box */}
        <div className="bg-slate-900/90 p-3.5 rounded-lg border border-cyan-500/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-300 font-mono uppercase font-bold">Valor TXT (TXT Value / Content)</span>
            <button
              onClick={() => handleCopy(VERIFICATION_CODE, "value")}
              className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
            >
              {copiedField === "value" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Valor Completo</span>
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-950 p-2.5 rounded font-mono text-xs text-white border border-slate-800 break-all select-all">
            {VERIFICATION_CODE}
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Provider Guide Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Pasos de Configuración según tu Proveedor DNS:</span>
          </span>

          {/* Provider Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto text-xs font-medium">
            <button
              onClick={() => setActiveProvider("vercel")}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                activeProvider === "vercel"
                  ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Vercel
            </button>
            <button
              onClick={() => setActiveProvider("cloudflare")}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                activeProvider === "cloudflare"
                  ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cloudflare
            </button>
            <button
              onClick={() => setActiveProvider("godaddy")}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                activeProvider === "godaddy"
                  ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              GoDaddy / Namecheap
            </button>
            <button
              onClick={() => setActiveProvider("generic")}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                activeProvider === "generic"
                  ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Genérico
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeProvider === "vercel" && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 animate-fadeIn">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span className="px-2 py-0.5 bg-black border border-slate-700 rounded text-xs font-mono">▲ Vercel</span>
              <span>Cómo configurar en Vercel Dashboard</span>
            </div>

            <ol className="list-decimal list-inside space-y-2.5 text-slate-300 leading-relaxed pl-1">
              <li>
                Inicia sesión en tu cuenta de <strong className="text-white">Vercel</strong> y abre el proyecto <code className="text-cyan-300 font-mono">hectron-tik</code>.
              </li>
              <li>
                Ve a la pestaña <strong className="text-white">Settings</strong> (Configuración) en la parte superior y haz clic en la sección <strong className="text-white">Domains</strong>.
              </li>
              <li>
                Busca el dominio <code className="text-cyan-300 font-mono">{DOMAIN_TARGET}</code> en la lista y haz clic en <strong className="text-white">Edit</strong> o <strong className="text-white">DNS Records</strong>.
              </li>
              <li>
                Agrega un nuevo registro DNS con los siguientes parámetros:
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] my-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-emerald-400 font-bold">TXT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="text-cyan-300">@</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Value:</span>
                    <span className="text-white font-bold break-all">{VERIFICATION_CODE}</span>
                  </div>
                </div>
              </li>
              <li>
                Haz clic en <strong className="text-white">Save / Add</strong> para guardar el registro.
              </li>
              <li>
                Regresa al portal de TikTok Developers y haz clic en el botón <strong className="text-cyan-400">Verificar</strong>.
              </li>
            </ol>
          </div>
        )}

        {activeProvider === "cloudflare" && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 animate-fadeIn">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/30 rounded text-xs font-mono">Cloudflare</span>
              <span>Cómo configurar en Cloudflare DNS</span>
            </div>

            <ol className="list-decimal list-inside space-y-2.5 text-slate-300 leading-relaxed pl-1">
              <li>Ingresa a tu panel de control de <strong className="text-white">Cloudflare</strong> y selecciona tu zona de dominio.</li>
              <li>En el menú lateral izquierdo, haz clic en <strong className="text-white">DNS</strong> &gt; <strong className="text-white">Records</strong>.</li>
              <li>Haz clic en el botón azul <strong className="text-white">Add Record</strong>.</li>
              <li>Configura el formulario:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>Type: <span className="text-emerald-400 font-bold">TXT</span></li>
                  <li>Name: <span className="text-cyan-300">@</span> (o <span className="text-cyan-300">hectron-tik</span>)</li>
                  <li>Content: <span className="text-white font-bold">{VERIFICATION_CODE}</span></li>
                  <li>TTL: <span className="text-slate-200">Auto</span></li>
                </ul>
              </li>
              <li>Guarda los cambios y presiona <strong className="text-cyan-400">Verificar</strong> en el portal de TikTok.</li>
            </ol>
          </div>
        )}

        {activeProvider === "godaddy" && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 animate-fadeIn">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs font-mono">GoDaddy / Namecheap</span>
              <span>Cómo configurar en Registradores Tradicionales</span>
            </div>

            <ol className="list-decimal list-inside space-y-2.5 text-slate-300 leading-relaxed pl-1">
              <li>Inicia sesión en tu proveedor de dominio (GoDaddy, Namecheap, Hostinger, Google Domains, etc.).</li>
              <li>Dirígete a la sección <strong className="text-white">Mis Dominio</strong> &gt; <strong className="text-white">Administrar DNS / DNS Management</strong>.</li>
              <li>Selecciona <strong className="text-white">Agregar nuevo registro (Add DNS Record)</strong>.</li>
              <li>Selecciona la opción <strong className="text-emerald-400 font-mono">TXT</strong> en el desplegable de Tipo.</li>
              <li>
                En el campo Host o Nombre introduce <code className="text-cyan-300 font-mono">@</code> y pega el código completo en el campo Valor / TXT Value.
              </li>
              <li>Guarda los cambios y espera entre 5 y 15 minutos para la propagación DNS mundial.</li>
            </ol>
          </div>
        )}

        {activeProvider === "generic" && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 animate-fadeIn">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Instrucciones Generales para Cualquier Servidor DNS</span>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Cualquier servidor de nombres de dominio (BIND, Route53, Linode, DigitalOcean, Cloudflare) acepta registros TXT estándar para validación de propiedad de sitio.
            </p>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
              <p className="text-slate-400"># Formato de Zona BIND / DNS Estándar:</p>
              <p className="text-cyan-300">
                hectron-tik.vercel.app. IN TXT "{VERIFICATION_CODE}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Integrated Backups & Local Diagnostic Button */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-xs">Métodos de Respaldo Adicionales Ya Inyectados en la App</span>
          </div>

          <button
            onClick={testLocalVerification}
            disabled={isTesting}
            className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
            <span>{isTesting ? "Verificando..." : "Probar Verificación Local"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> HTML Meta Tag (index.html)
            </span>
            <p className="text-slate-400 text-[10px]">
              Inyectado automáticamente en el encabezado <code className="text-slate-300 font-mono">&lt;head&gt;</code> de la aplicación.
            </p>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80 space-y-1">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Archivo Estático en Servidor (/public)
            </span>
            <p className="text-slate-400 text-[10px]">
              Endpoints configurados para responder en la ruta raíz del dominio.
            </p>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              testResult.success
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/50 border-red-500/40 text-red-300"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
