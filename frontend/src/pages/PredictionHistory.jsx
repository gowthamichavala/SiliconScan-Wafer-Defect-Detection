import React, { useState, useEffect } from 'react'
import {
  History as HistoryIcon,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  Clock,
  Gauge,
  Info
} from 'lucide-react'
import { getHistory, deleteHistoryItem, clearAllHistory } from '../services/api'

export default function PredictionHistory() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [classFilter, setClassFilter] = useState('')
  const [defectiveFilter, setDefectiveFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)

  const loadHistory = async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (classFilter) params.class_filter = classFilter
      if (defectiveFilter !== '') params.defective_filter = defectiveFilter === 'true'
      const data = await getHistory(params)
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [classFilter, defectiveFilter])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm(`Delete inspection record #${id}?`)) return
    try {
      await deleteHistoryItem(id)
      setItems(items.filter((item) => item.id !== id))
      setTotal(total - 1)
      if (selectedRecord?.id === id) setSelectedRecord(null)
    } catch (err) {
      alert('Delete failed: ' + err.message)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all inspection history?')) return
    try {
      await clearAllHistory()
      setItems([])
      setTotal(0)
      setSelectedRecord(null)
    } catch (err) {
      alert('Clear failed: ' + err.message)
    }
  }

  const filteredItems = items.filter((item) =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const classesList = [
    'Normal', 'Center', 'Donut', 'Edge-Loc', 'Edge-Ring',
    'Loc', 'Near-full', 'Random', 'Scratch'
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Inspection History & Log
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              SQLite
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of all processed wafers with stored Grad-CAM heatmaps and classifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadHistory}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Defect Classes</option>
            {classesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={defectiveFilter}
            onChange={(e) => setDefectiveFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="false">Normal Only</option>
            <option value="true">Defective Only</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Wafer</th>
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Filename</th>
                  <th className="pb-3 font-semibold">Predicted Class</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                  <th className="pb-3 font-semibold">Latency</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const isNormal = item.predicted_class === 'Normal'
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRecord(item)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt="wafer"
                            className="w-9 h-9 rounded border border-slate-700 object-cover bg-black"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="py-3 font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono text-slate-200">{item.filename}</td>
                      <td className="py-3 font-semibold text-white">{item.predicted_class}</td>
                      <td className="py-3 font-mono text-cyan-300">
                        {(item.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 font-mono text-slate-400">{item.inference_time_ms} ms</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isNormal
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isNormal ? 'Normal' : 'Defective'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRecord(item)
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No inspection records match your query.
          </div>
        )}
      </div>

      {/* Inspection Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Wafer Inspection Record #{selectedRecord.id}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                      selectedRecord.is_defective
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {selectedRecord.is_defective ? 'Defective' : 'Normal'}
                  </span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedRecord.filename} &bull; {new Date(selectedRecord.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Images: Original and Grad-CAM */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                <span className="text-xs font-mono text-slate-400 mb-2">Original Wafer</span>
                {selectedRecord.image_url ? (
                  <img
                    src={selectedRecord.image_url}
                    alt="Original"
                    className="w-44 h-44 rounded-lg object-contain bg-black border border-slate-800"
                  />
                ) : (
                  <div className="w-44 h-44 bg-slate-900 rounded-lg flex items-center justify-center text-xs text-slate-500">
                    Image not stored
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center">
                <span className="text-xs font-mono text-cyan-400 mb-2">Grad-CAM Activation Heatmap</span>
                {selectedRecord.heatmap_url ? (
                  <img
                    src={selectedRecord.heatmap_url}
                    alt="Grad-CAM"
                    className="w-44 h-44 rounded-lg object-contain bg-black border border-cyan-500/30 glow-cyan"
                  />
                ) : (
                  <div className="w-44 h-44 bg-slate-900 rounded-lg flex items-center justify-center text-xs text-slate-500">
                    Heatmap not stored
                  </div>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Predicted Class</span>
                <span className="font-bold text-white text-sm">{selectedRecord.predicted_class}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Confidence</span>
                <span className="font-bold font-mono text-cyan-400 text-sm">
                  {(selectedRecord.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Inference Latency</span>
                <span className="font-bold font-mono text-teal-300 text-sm">
                  {selectedRecord.inference_time_ms} ms
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
