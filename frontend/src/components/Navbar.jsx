import React from 'react'
import { Cpu, Activity, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function Navbar({ health, isBackendOnline }) {
  return (
    <header className="h-16 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 p-[2px] flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              SiliconScan <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">FAB AI</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400">Semiconductor Wafer Map Defect Classifier & Grad-CAM</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Model Status */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-medium">Model:</span>
          <span className="text-cyan-400 font-mono">
            {health?.model_loaded ? 'WaferCNN (9 Classes)' : 'Pending Training'}
          </span>
          {health?.device && (
            <span className="px-1.5 py-0.2 text-[10px] uppercase font-mono rounded bg-slate-800 text-slate-400">
              {health.device}
            </span>
          )}
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <div className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300 font-medium">API:</span>
          <span className={isBackendOnline ? 'text-emerald-400' : 'text-rose-400'}>
            {isBackendOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
