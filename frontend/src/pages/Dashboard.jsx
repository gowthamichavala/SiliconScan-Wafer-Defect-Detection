import React, { useEffect, useState } from 'react'
import {
  Layers,
  CheckCircle2,
  AlertOctagon,
  Percent,
  Clock,
  Gauge,
  ArrowRight,
  TrendingUp,
  ScanEye,
  RefreshCw
} from 'lucide-react'
import { getHistoryStats, getHistory, getMetrics } from '../services/api'

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, h, m] = await Promise.all([
        getHistoryStats().catch(() => null),
        getHistory({ limit: 6 }).catch(() => ({ items: [] })),
        getMetrics().catch(() => null)
      ])
      setStats(s)
      setRecent(h?.items || [])
      setMetrics(m)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const yieldRate = stats && stats.total_inspected > 0
    ? ((stats.normal_count / stats.total_inspected) * 100).toFixed(1)
    : '100.0'

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Fab Inspection Facility Live
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Semiconductor Wafer Defect Overview</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time automated wafer-map classification, defect localization via Grad-CAM, and die yield tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('single')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/20 transition-all"
          >
            <ScanEye className="w-4 h-4" />
            <span>Inspect New Wafer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Total Inspected</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats?.total_inspected ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Wafers Processed</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Normal Wafers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{stats?.normal_count ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Passed Quality Control</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Defective Wafers</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{stats?.defective_count ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Anomalies Detected</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Die Yield Rate</span>
            <Percent className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">{yieldRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Yield Pass Proportion</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Avg Confidence</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {stats && stats.average_confidence ? `${(stats.average_confidence * 100).toFixed(1)}%` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Classification Certainty</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>Mean Latency</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-teal-300 font-mono">
            {stats && stats.average_inference_time_ms ? `${stats.average_inference_time_ms} ms` : '--'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Real-time Inference</div>
        </div>
      </div>

      {/* Main Grid: Distribution & Model Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Observed Defect Distribution</h3>
              <p className="text-xs text-slate-400">Class breakdown across historical wafer inspections</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-lg">
              9 Defect Categories
            </span>
          </div>

          {stats && stats.class_distribution && Object.keys(stats.class_distribution).length > 0 ? (
            <div className="space-y-3 pt-2">
              {Object.entries(stats.class_distribution).map(([cls, count]) => {
                const maxVal = Math.max(...Object.values(stats.class_distribution), 1)
                const pct = ((count / stats.total_inspected) * 100).toFixed(1)
                const barWidth = `${Math.max((count / maxVal) * 100, 4)}%`
                const isNormal = cls === 'Normal'

                return (
                  <div key={cls} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-medium ${isNormal ? 'text-emerald-400' : 'text-slate-200'}`}>{cls}</span>
                      <span className="font-mono text-slate-400">{count} wafers ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isNormal ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs text-center border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <span>No historical inspections recorded yet.</span>
              <span className="text-slate-400 mt-1">Run single or batch inspections to populate this distribution.</span>
            </div>
          )}
        </div>

        {/* Model Intelligence Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">AI Model Performance</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                PyTorch CNN
              </span>
            </div>

            {metrics?.status === 'trained' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Measured Test Accuracy</div>
                  <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                    {(metrics.overall.accuracy * 100).toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Evaluated on {metrics.test_samples} independent test wafers
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Macro Precision</span>
                    <span className="font-mono font-bold text-white">
                      {(metrics.overall.macro_precision * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Macro Recall</span>
                    <span className="font-mono font-bold text-white">
                      {(metrics.overall.macro_recall * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Macro F1</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {metrics.overall.macro_f1.toFixed(4)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Weighted F1</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {metrics.overall.weighted_f1.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                <div className="font-semibold">Model Evaluation Pending</div>
                <p className="text-amber-200/80">
                  The model has not been evaluated yet. Run the training & evaluation pipeline to compute genuine scientific metrics.
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('metrics')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors border border-slate-700"
          >
            <span>View Full Confusion Matrix & Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Wafer Inspections</h3>
            <p className="text-xs text-slate-400">Latest predictions logged to SQLite</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View All History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Wafer Preview</th>
                  <th className="pb-3 font-semibold">Filename</th>
                  <th className="pb-3 font-semibold">Predicted Class</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                  <th className="pb-3 font-semibold">Inference Latency</th>
                  <th className="pb-3 font-semibold">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recent.map((row) => {
                  const isNormal = row.predicted_class === 'Normal'
                  return (
                    <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5">
                        {row.image_url ? (
                          <img src={row.image_url} alt="wafer" className="w-8 h-8 rounded border border-slate-700 object-cover bg-black" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 font-mono text-slate-300">{row.filename}</td>
                      <td className="py-2.5 font-semibold text-white">{row.predicted_class}</td>
                      <td className="py-2.5 font-mono text-cyan-300">
                        {(row.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 font-mono text-slate-400">{row.inference_time_ms} ms</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isNormal
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isNormal ? 'Normal' : 'Defective'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500 text-xs">
            No inspection records found. Use the "Single Inspection" tab to test your first wafer.
          </div>
        )}
      </div>
    </div>
  )
}
