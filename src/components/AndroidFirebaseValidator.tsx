import { useState, useMemo, ChangeEvent, DragEvent } from "react";
import firebaseConfig from "../../firebase-applet-config.json";
import {
  ShieldCheck,
  FileCode,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Smartphone,
  Info,
  RefreshCw,
  Sliders,
  CheckCheck
} from "lucide-react";

interface ValidationItem {
  key: string;
  label: string;
  status: "success" | "error" | "warning";
  foundValue: string;
  expectedValue: string;
  description: string;
}

export function AndroidFirebaseValidator() {
  const [packageName, setPackageName] = useState<string>("com.hectron.streamer");
  const [jsonInput, setJsonInput] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Helper function to copy text
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate a valid sample google-services.json based on current Firebase project config
  const sampleGoogleServices = useMemo(() => {
    return JSON.stringify(
      {
        project_info: {
          project_number: firebaseConfig.messagingSenderId,
          project_id: firebaseConfig.projectId,
          storage_bucket: firebaseConfig.storageBucket,
          firebase_url: `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
        },
        client: [
          {
            client_info: {
              mobilesdk_app_id: `1:${firebaseConfig.messagingSenderId}:android:${packageName.replace(/\./g, "")}`,
              android_client_info: {
                package_name: packageName
              }
            },
            oauth_client: [
              {
                client_id: firebaseConfig.oAuthClientId,
                client_type: 3
              }
            ],
            api_key: [
              {
                current_key: firebaseConfig.apiKey
              }
            ],
            services: {
              appinvite_service: {
                other_platform_oauth_client: []
              }
            }
          }
        ],
        configuration_version: "1"
      },
      null,
      2
    );
  }, [packageName]);

  const loadSampleJson = () => {
    setJsonInput(sampleGoogleServices);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setJsonInput(content);
      }
    };
    reader.readAsText(file);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const downloadGeneratedJson = () => {
    const blob = new Blob([sampleGoogleServices], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "google-services.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Perform deep validation between input JSON & expected Firebase config
  const validationResult = useMemo(() => {
    if (!jsonInput.trim()) {
      return {
        parsed: null,
        error: null,
        items: [] as ValidationItem[],
        score: 0,
        status: "idle" as const
      };
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const items: ValidationItem[] = [];

      // 1. Project ID Validation
      const foundProjectId = parsed.project_info?.project_id || "No encontrado";
      const expectedProjectId = firebaseConfig.projectId;
      items.push({
        key: "project_id",
        label: "ID de Proyecto (project_id)",
        status: foundProjectId === expectedProjectId ? "success" : "error",
        foundValue: foundProjectId,
        expectedValue: expectedProjectId,
        description: "Debe coincidir exactamente con el ID del proyecto Firebase activo en el servidor."
      });

      // 2. Project Number Validation
      const foundProjectNumber = String(parsed.project_info?.project_number || "No encontrado");
      const expectedProjectNumber = String(firebaseConfig.messagingSenderId);
      items.push({
        key: "project_number",
        label: "Número de Proyecto (project_number / sender_id)",
        status: foundProjectNumber === expectedProjectNumber ? "success" : "error",
        foundValue: foundProjectNumber,
        expectedValue: expectedProjectNumber,
        description: "Número de remitente de mensajería (Sender ID) de GCP/Firebase."
      });

      // 3. Storage Bucket Validation
      const foundBucket = parsed.project_info?.storage_bucket || "No encontrado";
      const expectedBucket = firebaseConfig.storageBucket;
      items.push({
        key: "storage_bucket",
        label: "Storage Bucket (storage_bucket)",
        status: foundBucket === expectedBucket ? "success" : "warning",
        foundValue: foundBucket,
        expectedValue: expectedBucket,
        description: "Contenedor de almacenamiento predeterminado para Firebase Storage."
      });

      // 4. Package Name & Client Matching
      const clients = Array.isArray(parsed.client) ? parsed.client : [];
      const matchingClient = clients.find(
        (c: any) => c.client_info?.android_client_info?.package_name === packageName
      );

      const foundPackages = clients
        .map((c: any) => c.client_info?.android_client_info?.package_name)
        .filter(Boolean);

      items.push({
        key: "package_name",
        label: "Nombre de Paquete Android (package_name)",
        status: matchingClient ? "success" : "error",
        foundValue: matchingClient
          ? packageName
          : foundPackages.length > 0
          ? foundPackages.join(", ")
          : "Ningún cliente configurado",
        expectedValue: packageName,
        description: matchingClient
          ? `El paquete '${packageName}' está correctamente declarado en el arreglo 'client'.`
          : `No se encontró un cliente con package_name '${packageName}' en el archivo JSON. Se encontraron: [${foundPackages.join(", ") || "Ninguno"}].`
      });

      // 5. API Key Check
      let foundApiKey = "No encontrada";
      if (matchingClient && Array.isArray(matchingClient.api_key) && matchingClient.api_key.length > 0) {
        foundApiKey = matchingClient.api_key[0].current_key || "Vacía";
      } else if (clients.length > 0 && Array.isArray(clients[0].api_key) && clients[0].api_key.length > 0) {
        foundApiKey = clients[0].api_key[0].current_key || "Vacía";
      }

      const expectedApiKey = firebaseConfig.apiKey;
      items.push({
        key: "api_key",
        label: "API Key de Firebase (current_key)",
        status: foundApiKey === expectedApiKey ? "success" : "error",
        foundValue: foundApiKey.length > 12 ? `${foundApiKey.substring(0, 8)}...${foundApiKey.substring(foundApiKey.length - 4)}` : foundApiKey,
        expectedValue: `${expectedApiKey.substring(0, 8)}...${expectedApiKey.substring(expectedApiKey.length - 4)}`,
        description: "Clave de API Web/Android registrada en el proyecto Firebase para peticiones SDK."
      });

      // 6. Mobile SDK App ID Validation
      let foundAppId = "No encontrado";
      if (matchingClient && matchingClient.client_info?.mobilesdk_app_id) {
        foundAppId = matchingClient.client_info.mobilesdk_app_id;
      }
      const isAppIdValid = foundAppId.includes(`1:${expectedProjectNumber}:android:`);
      items.push({
        key: "mobilesdk_app_id",
        label: "App ID del SDK Móvil (mobilesdk_app_id)",
        status: isAppIdValid ? "success" : "warning",
        foundValue: foundAppId,
        expectedValue: `1:${expectedProjectNumber}:android:<app_hash>`,
        description: "Identificador único asignado por Firebase para la aplicación nativa de Android."
      });

      // 7. OAuth Client ID Check
      let foundOAuthClients: string[] = [];
      if (matchingClient && Array.isArray(matchingClient.oauth_client)) {
        foundOAuthClients = matchingClient.oauth_client.map((oc: any) => oc.client_id).filter(Boolean);
      }
      const hasOAuthMatch = foundOAuthClients.some((cid) => cid.includes(expectedProjectNumber));
      items.push({
        key: "oauth_client",
        label: "Cliente OAuth de Google (oauth_client)",
        status: hasOAuthMatch ? "success" : "warning",
        foundValue: foundOAuthClients.length > 0 ? `${foundOAuthClients.length} cliente(s) OAuth registrado(s)` : "Ninguno",
        expectedValue: `Contiene ID vinculado al proyecto (${expectedProjectNumber})`,
        description: "Requerido para autenticación con Google y flujos nativos con TikTok/Firebase Auth."
      });

      const successCount = items.filter((i) => i.status === "success").length;
      const score = Math.round((successCount / items.length) * 100);

      return {
        parsed,
        error: null,
        items,
        score,
        status: score === 100 ? "valid" : score >= 70 ? "warning" : "invalid"
      };
    } catch (err: any) {
      return {
        parsed: null,
        error: err?.message || "Formato JSON inválido",
        items: [],
        score: 0,
        status: "error" as const
      };
    }
  }, [jsonInput, packageName]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Validador de SDK de Android & Firebase</span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                google-services.json
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Verifica que la configuración de tu archivo <code className="text-cyan-300 font-mono text-[11px]">google-services.json</code> y el paquete Android coincidan perfectamente con el proyecto Firebase de la app.
            </p>
          </div>
        </div>

        <button
          onClick={loadSampleJson}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Cargar Configuración Oficial</span>
        </button>
      </div>

      {/* Package Name Input & Firebase Active Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Paquete Android Target (package_name)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Modificable</span>
          </label>
          <input
            type="text"
            value={packageName}
            onChange={(e) => setPackageName(e.target.value.trim())}
            placeholder="ej. com.hectron.streamer"
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none transition"
          />
          <p className="text-[11px] text-slate-400 leading-tight">
            Debe ser idéntico al <code className="text-cyan-300 font-mono">applicationId</code> en tu archivo <code className="text-slate-300 font-mono">build.gradle</code> de Android.
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Configuración Firebase Activa (Servidor)</span>
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block uppercase">Project ID</span>
              <span className="text-cyan-300 font-semibold truncate block">{firebaseConfig.projectId}</span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
              <span className="text-[9px] text-slate-400 block uppercase">Project Number</span>
              <span className="text-cyan-300 font-semibold truncate block">{firebaseConfig.messagingSenderId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Dropzone & Raw JSON Textarea */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Contenido de google-services.json</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadGeneratedJson}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/20 cursor-pointer transition"
            >
              <Download className="w-3 h-3" />
              <span>Descargar .json Válido</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-xl p-4 text-center transition ${
            isDragging
              ? "border-cyan-400 bg-cyan-950/30"
              : jsonInput.trim()
              ? "border-slate-800 bg-slate-950/60"
              : "border-slate-800 hover:border-slate-700 bg-slate-950"
          }`}
        >
          <input
            type="file"
            accept=".json,application/json"
            onChange={onFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Sube o arrastra tu archivo google-services.json"
          />
          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Upload className={`w-6 h-6 ${isDragging ? "text-cyan-400 animate-bounce" : "text-slate-400"}`} />
            <p className="text-xs text-slate-300 font-medium">
              Arrastra y suelta aquí tu archivo <code className="text-cyan-300 font-mono font-bold">google-services.json</code> o haz clic para explorar
            </p>
            <p className="text-[10px] text-slate-500">También puedes pegar directamente el contenido JSON en el cuadro a continuación</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`Pega el contenido de tu google-services.json aquí o haz clic en "Cargar Configuración Oficial"...`}
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg p-3 text-xs font-mono text-slate-200 outline-none leading-relaxed transition resize-y"
          />
          {jsonInput.trim() && (
            <button
              onClick={() => setJsonInput("")}
              className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono cursor-pointer transition"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Validation Results Display */}
      {validationResult.status !== "idle" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Status Header Banner */}
          {validationResult.status === "error" ? (
            <div className="bg-red-950/50 border border-red-500/40 p-4 rounded-xl flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-red-200 text-sm block">Error de Sintaxis o Lectura de JSON</span>
                <p className="text-xs text-red-300">{validationResult.error}</p>
                <p className="text-[11px] text-slate-400">
                  Asegúrate de copiar el JSON completo descargado desde la consola de Firebase.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                validationResult.status === "valid"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {validationResult.status === "valid" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-sm block text-white">
                    {validationResult.status === "valid"
                      ? "✅ Configuración 100% Válida & Sincronizada"
                      : "⚠️ Advertencia de Discrepancia en Configuración"}
                  </span>
                  <span className="text-xs text-slate-300">
                    {validationResult.status === "valid"
                      ? `Todos los parámetros coinciden exactamente con el proyecto Firebase '${firebaseConfig.projectId}'.`
                      : "Se detectaron diferencias entre el JSON proporcionado y la configuración oficial del servidor."}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Coincidencia</span>
                  <span className="text-lg font-black font-mono text-white">{validationResult.score}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Validation Checklist Table */}
          {validationResult.items.length > 0 && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200">
                <span>Resultado del Análisis Detallado (Matriz de Diagnóstico)</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {validationResult.items.filter((i) => i.status === "success").length} / {validationResult.items.length} Aprobados
                </span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {validationResult.items.map((item) => (
                  <div key={item.key} className="p-3.5 hover:bg-slate-900/40 transition space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.status === "success" && <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {item.status === "error" && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                        {item.status === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                        <span className="text-xs font-bold text-white">{item.label}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          item.status === "success"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : item.status === "error"
                            ? "bg-red-950 text-red-400 border border-red-500/30"
                            : "bg-amber-950 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {item.status === "success" ? "Coincide" : item.status === "error" ? "Discrepancia" : "Atención"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pl-6">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-sans">Valor en tu JSON</span>
                        <span className={item.status === "success" ? "text-slate-200" : "text-red-300 font-bold"}>
                          {item.foundValue}
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-[9px] text-slate-500 block uppercase font-sans">Valor Esperado (Firebase)</span>
                        <span className="text-cyan-300 font-semibold">{item.expectedValue}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Integration Guide for Android */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4" />
              <span>Instrucciones de Colocación en el Proyecto Android</span>
            </span>

            <div className="space-y-2 text-slate-300 leading-relaxed">
              <p>
                1. Descarga o copia el archivo <code className="text-cyan-300 font-mono">google-services.json</code> válido.
              </p>
              <p>
                2. Colócalo exactamente en la carpeta raíz del módulo de la app Android:
              </p>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-cyan-200 flex items-center justify-between">
                <span>android/app/google-services.json</span>
                <button
                  onClick={() => handleCopy("android/app/google-services.json", "path")}
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-sans text-[10px] cursor-pointer"
                >
                  {copiedKey === "path" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "path" ? "Copiado" : "Copiar"}</span>
                </button>
              </div>

              <p>
                3. En tu archivo <code className="text-cyan-300 font-mono">android/app/build.gradle</code>, asegúrate de aplicar el plugin de Google Services al final:
              </p>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-200 flex items-center justify-between">
                <span>apply plugin: 'com.google.gms.google-services'</span>
                <button
                  onClick={() => handleCopy("apply plugin: 'com.google.gms.google-services'", "plugin")}
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-sans text-[10px] cursor-pointer"
                >
                  {copiedKey === "plugin" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "plugin" ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
