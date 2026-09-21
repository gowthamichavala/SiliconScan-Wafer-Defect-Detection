import React from 'react'
import {
  LayoutDashboard,
  ScanEye,
  Layers,
  History,
  BarChart3,
  BookOpen,
  Microchip,
  Sparkles
} from 'lucide-react'

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'single', label: 'Single Inspection', icon: ScanEye, badge: 'Grad-CAM' },
    { id: 'batch', label: 'Batch Inspection', icon: Layers, badge: null },
    { id: 'history', label: 'Inspection History', icon: History, badge: null },
    { id: 'metrics', label: 'Model Metrics', icon: BarChart3, badge: 'Real Test' },
    { id: 'about', label: 'About & Fab Domain', icon: BookOpen, badge: null },
  ]

  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Wafer Inspection System
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-800 text-cyan-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Fab Domain Quick Reference */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Microchip className="w-4 h-4 text-cyan-400" />
            <span>9 Canonical Classes</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Normal, Center, Donut, Edge-Loc, Edge-Ring, Loc, Near-full, Random, Scratch.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/60">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Academic Project 2026</span>
        </div>
      </div>
    </aside>
  )
}
