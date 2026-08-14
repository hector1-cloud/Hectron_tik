import React, { useState } from "react";
import { 
  Building2, 
  Target, 
  Database, 
  Cloud, 
  Cpu, 
  Video, 
  Mic2, 
  TrendingUp, 
  Gavel, 
  ShieldCheck, 
  CheckCircle2, 
  Circle,
  ExternalLink,
  ChevronRight,
  Code2,
  FileText,
  CreditCard,
  Map,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ExecutiveGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("context");

  const sections = [
    { id: "context", title: "Estrategia", icon: Target },
    { id: "infra", title: "Infraestructura", icon: Cloud },
    { id: "architecture", title: "Arquitectura", icon: Building2 },
    { id: "legal", title: "Legal & Fintech", icon: Gavel },
    { id: "monetization", title: "Monetización", icon: TrendingUp },
    { id: "roadmap", title: "Roadmap", icon: Map },
  ];

  const checklistItems = [
    { label: "Crear proyecto GCP: abadalabs-hectron-prod", status: true },
    { label: "Obtener GEMINI_API_KEY (Google AI Studio)", status: true },
    { label: "Configurar Service Account en GCP", status: true },
    { label: "Crear dataset abadalabs_hectron_prod en BigQuery", status: false },
    { label: "Configurar OBS WebSocket (Puerto 4455)", status: true },
    { label: "Obtener STREAM_KEY de TikTok LIVE", status: false },
    { label: "Crear cuenta Stripe para Abadalabs, Inc.", status: false },
    { label: "Registrar dominio hectron.abadalabs.com", status: false },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Building2 className="text-slate-950" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">HECTRON <span className="text-cyan-400">Live Universe</span></h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Abadalabs, Inc. • Executive Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enterprise Ready</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/20 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === s.id 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <s.icon size={18} />
                <span className="text-sm font-semibold">{s.title}</span>
                {activeSection === s.id && <ChevronRight size={14} className="ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="mt-10 pt-6 border-t border-slate-800/50">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-4">Checklist de Implementación</h3>
            <div className="space-y-3 px-2">
              {checklistItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  {item.status ? (
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5" />
                  ) : (
                    <Circle size={14} className="text-slate-700 mt-0.5 group-hover:text-slate-500 transition-colors" />
                  )}
                  <span className={`text-[10px] leading-tight ${item.status ? "text-slate-300" : "text-slate-500"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              {activeSection === "context" && (
                <div className="space-y-8">
                  <header>
                    <h2 className="text-3xl font-bold text-white mb-4">Contexto Estratégico</h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                      Abadalabs, Inc. (Delaware C-Corp) está desarrollando <strong className="text-cyan-400">HECTRON Live Universe</strong>, 
                      un ecosistema de streaming autónomo diseñado para escalar a nivel global.
                    </p>
                  </header>

                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { title: "Gemini AI", desc: "Generación de contenido en tiempo real y lógica de juego dinámica.", icon: Cpu, color: "blue" },
                      { title: "BigQuery", desc: "Almacenamiento masivo de analítica y eventos persistentes.", icon: Database, color: "purple" },
                      { title: "ElevenLabs", desc: "Voz sintética de alta fidelidad para el avatar HECTRON.", icon: Mic2, color: "orange" },
                      { title: "Cloud Run", desc: "Infraestructura auto-escalable para el motor de autonomía.", icon: Cloud, color: "cyan" },
                    ].map((feature, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
                          <feature.icon className={`text-${feature.color}-400`} size={20} />
                        </div>
                        <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-slate-400">{feature.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                    <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                      <Target size={18} /> Objetivo Corporativo
                    </h3>
                    <p className="text-slate-300 italic">
                      "Crear un producto escalable, profesional y vanguardista que posicione a Abadalabs como líder en innovación de streaming interactivo con IA."
                    </p>
                  </div>
                </div>
              )}

              {activeSection === "infra" && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold text-white mb-6">Infraestructura Empresarial</h2>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                      <Cloud className="text-cyan-400" size={20} /> Google Cloud Platform
                    </h3>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-400">abadalabs-hectron-prod</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">ACTIVE</span>
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Service Account</p>
                          <p className="text-xs font-mono text-cyan-400">abadalabs-hectron-bot@...</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Dataset ID</p>
                          <p className="text-xs font-mono text-cyan-400">abadalabs_hectron_prod</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                      <TrendingUp className="text-purple-400" size={20} /> Escalabilidad Gemini
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Modelo", val: "Gemini 1.5 Flash" },
                        { label: "Cuota", val: "10M tokens/día" },
                        { label: "Tier", val: "Enterprise" },
                      ].map((item, i) => (
                        <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{item.label}</p>
                          <p className="text-sm font-bold text-white">{item.val}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="text-orange-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm font-bold text-orange-400">Recomendación Ejecutiva</p>
                      <p className="text-xs text-slate-400 italic">"Priorizar la integración con Gemini Enterprise para mayor control de datos y cumplimiento normativo."</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "architecture" && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold text-white mb-6">Arquitectura de Sistemas</h2>
                  
                  <div className="relative p-12 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1),transparent_70%)]"></div>
                    
                    <div className="relative grid grid-cols-3 gap-12">
                      {/* Frontend */}
                      <div className="space-y-6">
                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-center">
                          <Video size={24} className="mx-auto mb-3 text-cyan-400" />
                          <p className="font-bold text-sm text-white">OBS Studio</p>
                          <p className="text-[10px] text-slate-500">Live Overlay 3D</p>
                        </div>
                        <div className="h-12 w-px bg-gradient-to-b from-slate-700 to-transparent mx-auto"></div>
                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-center">
                          <TrendingUp size={24} className="mx-auto mb-3 text-pink-400" />
                          <p className="font-bold text-sm text-white">TikTok LIVE</p>
                          <p className="text-[10px] text-slate-500">Interactividad</p>
                        </div>
                      </div>

                      {/* Backend */}
                      <div className="flex flex-col justify-center">
                        <div className="p-8 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-3xl text-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                          <Cpu size={32} className="mx-auto mb-4 text-cyan-400 animate-pulse" />
                          <p className="font-bold text-lg text-white">HECTRON Core</p>
                          <p className="text-xs text-cyan-400/70 font-mono">Autonomy Engine</p>
                        </div>
                      </div>

                      {/* AI & Data */}
                      <div className="space-y-6">
                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-center">
                          <Database size={24} className="mx-auto mb-3 text-purple-400" />
                          <p className="font-bold text-sm text-white">BigQuery</p>
                          <p className="text-[10px] text-slate-500">Data Analytics</p>
                        </div>
                        <div className="h-12 w-px bg-gradient-to-b from-slate-700 to-transparent mx-auto"></div>
                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-center">
                          <Cloud size={24} className="mx-auto mb-3 text-emerald-400" />
                          <p className="font-bold text-sm text-white">Gemini IA</p>
                          <p className="text-[10px] text-slate-500">Brain Layer</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <Code2 size={14} /> Stack Tecnológico
                      </h4>
                      <ul className="space-y-2">
                        {["Node.js (Backend)", "React + Vite (UI)", "Three.js (3D Render)", "WebSockets (Real-time)"].map((tech, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                            {tech}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <Cloud size={14} /> Integraciones Pro
                      </h4>
                      <ul className="space-y-2">
                        {["Stripe (Pagos)", "ElevenLabs (Voz)", "OBS WebSocket v5", "TikTok Events API"].map((api, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                            {api}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "legal" && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold text-white mb-6">Marco Legal y Financiero</h2>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          <Gavel className="text-amber-400" size={20} /> Protección IP
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">EN PROCESO</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Marca: HECTRON</span>
                          <span className="text-slate-300">Clase 42 & 9</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Dominio: hectron.ai</span>
                          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> OK</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          <CreditCard className="text-emerald-400" size={20} /> Pasarela Stripe
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">READY</span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Suscripciones</span>
                          <span className="text-slate-300">Basic / Pro / Ent</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Webhooks</span>
                          <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Config</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                      <ShieldCheck className="text-cyan-400" size={20} /> Compliance & Privacidad
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { label: "GDPR", status: "EU Standard" },
                        { label: "CCPA", status: "California" },
                        { label: "LGPD", status: "Brazil" },
                      ].map((reg, i) => (
                        <div key={i} className="p-4 bg-slate-800/50 rounded-xl text-center">
                          <p className="font-bold text-white mb-1">{reg.label}</p>
                          <p className="text-[10px] text-cyan-400/70 font-mono tracking-widest">{reg.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-slate-800/30 border-b border-slate-800 font-bold text-xs uppercase tracking-widest text-slate-400">
                      Entidad Corporativa
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Razón Social</p>
                        <p className="text-sm text-white">Abadalabs, Inc. (Delaware C-Corp)</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Sede Central</p>
                        <p className="text-sm text-white">131 Continental Dr, Suite 305, Newark, DE 19713</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "monetization" && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-bold text-white mb-6">Estrategia de Monetización</h2>
                  
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { tier: "Basic", price: "Free", margin: "0%", color: "slate" },
                      { tier: "Pro", price: "$19.99/mo", margin: "80%", color: "cyan" },
                      { tier: "Enterprise", price: "$99.99/mo", margin: "85%", color: "purple" },
                    ].map((plan, i) => (
                      <div key={i} className={`p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden group`}>
                        {plan.tier === "Pro" && <div className="absolute top-0 right-0 p-2 bg-cyan-500 text-slate-950 text-[10px] font-bold rounded-bl-xl">POPULAR</div>}
                        <h3 className="text-slate-400 font-bold mb-1">{plan.tier}</h3>
                        <p className="text-2xl font-bold text-white mb-4">{plan.price}</p>
                        <div className="h-1 w-full bg-slate-800 rounded-full mb-4">
                          <div className={`h-full bg-${plan.color}-500 rounded-full`} style={{ width: plan.margin }}></div>
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Margen: {plan.margin}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                      <BarChart3 className="text-emerald-400" size={20} /> Proyecciones ROI
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-end gap-2 h-32 px-4">
                        {[40, 65, 80, 55, 95, 120, 150].map((h, i) => (
                          <div key={i} className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500/60 rounded-t-lg transition-all hover:to-emerald-400" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 text-[10px] font-bold text-slate-500 text-center uppercase tracking-widest">
                        <span>Q3 26</span>
                        <span>Q4 26</span>
                        <span>Q1 27</span>
                        <span>Q2 27</span>
                        <span>Q3 27</span>
                        <span>Q4 27</span>
                        <span>Q1 28</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "roadmap" && (
                <div className="space-y-12">
                  <h2 className="text-3xl font-bold text-white mb-6">Hoja de Ruta (Roadmap)</h2>
                  
                  <div className="space-y-12 relative before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-px before:bg-slate-800">
                    {[
                      { q: "Q3 2026", title: "Lanzamiento MVP", desc: "Lanzamiento de HECTRON Basic e integración inicial con TikTok LIVE.", items: ["100 Usuarios Beta", "TikTok Connect", "Gemini Core"] },
                      { q: "Q4 2026", title: "Fase de Monetización", desc: "Lanzamiento de HECTRON Pro e integración total con Stripe.", items: ["$5,000 MRR Target", "Dashboard de Analítica", "ElevenLabs Voice Sync"] },
                      { q: "Q1 2027", title: "Escalabilidad Global", desc: "Lanzamiento de HECTRON Enterprise y API pública para desarrolladores.", items: ["1,000 Usuarios Activos", "API Gateway", "Multi-Language Support"] },
                      { q: "Q2 2027", title: "Ecosistema Expandido", desc: "Versión móvil nativa y soporte para Twitch y YouTube Studio.", items: ["Cross-Platform Sync", "Mobile Remote", "Asset Marketplace"] },
                    ].map((step, i) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                          <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                          <span className="text-cyan-400 font-bold text-sm tracking-widest">{step.q}</span>
                          <h3 className="text-lg font-bold text-white">{step.title}</h3>
                        </div>
                        <p className="text-sm text-slate-400 mb-4">{step.desc}</p>
                        <div className="flex flex-wrap gap-2">
                          {step.items.map((item, j) => (
                            <span key={j} className="px-2 py-1 bg-slate-800/50 border border-slate-700 rounded-lg text-[10px] font-medium text-slate-300">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Status Bar */}
      <footer className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span>SYS_OK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            <span>BIGQUERY_SYNC: 98%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            <span>GEMINI_FLASH: READY</span>
          </div>
        </div>
        <div>
          © 2026 ABADALABS, INC. • DELAWARE C-CORP • ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  );
};

export default ExecutiveGuide;
