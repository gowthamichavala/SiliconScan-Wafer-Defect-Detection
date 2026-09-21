import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  Play,
  Download,
  CheckCircle2,
  AlertOctagon,
  Percent,
  Layers,
  Clock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { predictBatch } from '../services/api'

export default function BatchInspection() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [batchResult, setBatchResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFilesSelect = (selectedList) => {
    if (!selectedList || selectedList.length === 0) return
    setFiles(Array.from(selectedList))
    setBatchResult(null)
    setError(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files)
    }
  }

  const runBatch = async () => {
    if (files.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const data = await predictBatch(files)
      setBatchResult(data)
    } catch (err) {
      setError(err.message || 'Batch prediction failed.')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!batchResult || !batchResult.items || batchResult.items.length === 0) return

    const headers = ['Filename', 'Predicted Class', 'Confidence', 'Inference Time (ms)', 'Defective Status', 'Timestamp']
    const rows = batchResult.items.map((item) => [
      item.filename,
      item.predicted_class,
      (item.confidence * 100).toFixed(2) + '%',
      item.inference_time_ms,
      item.is_defective ? 'DEFECTIVE' : 'NORMAL',
      item.timestamp
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `wafer_batch_inspection_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Batch Wafer Inspection
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Multi-Wafer Processing
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Process entire lots or trays of semiconductor wafers in a single inference pipeline.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="p-8 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFilesSelect(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors mb-3">
          <UploadCloud className="w-7 h-7" />
        </div>
        <div className="text-sm font-semibold text-white group-hover:text-cyan-300">
          {files.length > 0 ? `${files.length} wafer images selected` : 'Drop multiple wafer images here'}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Select or drag multiple wafer files to run simultaneous batch classification
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={runBatch}
          disabled={files.length === 0 || loading}
          className={`w-full sm:w-auto py-2.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
            files.length === 0 || loading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Lot ({files.length} wafers)...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Batch Inspection ({files.length})</span>
            </>
          )}
        </button>

        {batchResult && batchResult.items.length > 0 && (
          <button
            onClick={exportCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Lot Results to CSV</span>
          </button>
        )}
      </div>

      {/* Batch Summary Stats */}
      {batchResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Processed</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {batchResult.total_processed}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Normal</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {batchResult.normal_count}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Defective</span>
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400">
              {batchResult.defective_count}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-400" />
              <span>Yield Rate</span>
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300">
              {(100 - batchResult.defect_rate).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {batchResult && batchResult.items.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Wafer</th>
                  <th className="pb-3 font-semibold">Filename</th>
                  <th className="pb-3 font-semibold">Predicted Defect Class</th>
                  <th className="pb-3 font-semibold">Confidence</th>
                  <th className="pb-3 font-semibold">Latency</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batchResult.items.map((row, idx) => {
                  const isNormal = row.predicted_class === 'Normal'
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5">
                        {row.image_url ? (
                          <img
                            src={row.image_url}
                            alt="wafer"
                            className="w-8 h-8 rounded border border-slate-700 object-cover bg-black"
                          />
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
