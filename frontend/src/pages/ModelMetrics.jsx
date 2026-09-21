import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText
} from 'lucide-react'
import { getMetrics } from '../services/api'

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMetrics()
      setMetrics(data)
    } catch (err) {
      setError(err.message || 'Failed to load model metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  const isTrained = metrics?.status === 'trained'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Model Evaluation & Scientific Metrics
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Verified Test Split
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real performance benchmarks computed from the independent test split. No hard-coded or fabricated metrics.
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors self-start"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isTrained ? (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-500/30">
              <span className="text-xs text-slate-400 block mb-1">Overall Test Accuracy</span>
              <div className="text-3xl font-extrabold font-mono text-cyan-400">
                {(metrics.overall.accuracy * 100).toFixed(2)}%
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                On {metrics.test_samples} unseen test samples
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Macro F1-Score</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-400">
                {metrics.overall.macro_f1.toFixed(4)}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Unweighted mean across 9 classes
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Macro Precision</span>
              <div className="text-3xl font-extrabold font-mono text-indigo-300">
                {(metrics.overall.macro_precision * 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Average defect positive predictive rate
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Macro Recall (Sensitivity)</span>
              <div className="text-3xl font-extrabold font-mono text-amber-300">
                {(metrics.overall.macro_recall * 100).toFixed(1)}%
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Average defect capture rate
              </span>
            </div>
          </div>

          {/* Confusion Matrix and Per-Class Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Confusion Matrix Plot */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">9x9 Confusion Matrix</h3>
                  <p className="text-xs text-slate-400">Ground truth vs. predicted classification</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
                  Plot Generated
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
                <img
                  src={metrics.confusion_matrix_image_url || '/results/confusion_matrix.png'}
                  alt="Confusion Matrix"
                  className="w-full max-h-[460px] object-contain rounded-lg"
                />
              </div>
            </div>

            {/* Per-Class Table & Architecture Details */}
            <div className="lg:col-span-6 space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-sm font-semibold text-white mb-3">Per-Class Performance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="pb-2.5 font-semibold">Defect Class</th>
                        <th className="pb-2.5 font-semibold">Precision</th>
                        <th className="pb-2.5 font-semibold">Recall</th>
                        <th className="pb-2.5 font-semibold">F1-Score</th>
                        <th className="pb-2.5 font-semibold">Support</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {metrics.per_class &&
                        Object.entries(metrics.per_class).map(([cls, pc]) => (
                          <tr key={cls} className="hover:bg-slate-800/30">
                            <td className="py-2 font-medium text-white">{cls}</td>
                            <td className="py-2 font-mono text-cyan-300">
                              {(pc.precision * 100).toFixed(1)}%
                            </td>
                            <td className="py-2 font-mono text-amber-300">
                              {(pc.recall * 100).toFixed(1)}%
                            </td>
                            <td className="py-2 font-mono font-bold text-emerald-400">
                              {pc.f1_score.toFixed(4)}
                            </td>
                            <td className="py-2 font-mono text-slate-400">{pc.support}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CNN Hyperparameters & Training Specs */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Model Architecture & Training Parameters
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Backbone Architecture</span>
                    <span className="font-semibold text-white">WaferCNN (4-stage Conv2d)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Input Dimensions</span>
                    <span className="font-semibold text-white">64 x 64 (1 Channel Gray)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Loss Criterion</span>
                    <span className="font-semibold text-white">CrossEntropyLoss</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Optimizer / LR</span>
                    <span className="font-semibold text-white">Adam (lr = 0.001)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-10 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Evaluation Metrics Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              To respect academic standards, metrics are not hard-coded. Please run the training and evaluation scripts to generate real benchmarks.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-400 text-left">
            <div>python ml/train.py</div>
            <div>python ml/evaluate.py</div>
          </div>
        </div>
      )}
    </div>
  )
}
