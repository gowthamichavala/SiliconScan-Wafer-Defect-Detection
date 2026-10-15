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
  AlertTriangle,
  X
} from 'lucide-react'
import { predictBatch, getBackendUrl } from '../services/api'

export default function BatchInspection() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [batchResult, setBatchResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFilesSelect = (selectedList) => {
    if (!selectedList || selectedList.length === 0) return
    const incoming = Array.from(selectedList)

    setFiles((prev) => {
      const existingKeys = new Set(
        prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`)
      )
      const uniqueIncoming = incoming.filter(
        (f) => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`)
      )
      return [...prev, ...uniqueIncoming]
    })
    setBatchResult(null)
    setError(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files)
    }
  }

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    setBatchResult(null)
  }

  const clearAllFiles = () => {
    setFiles([])
    setBatchResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFilesSelect(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="p-8 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
      >
        <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors mb-3">
          <UploadCloud className="w-7 h-7" />
        </div>
        <div className="text-sm font-semibold text-white group-hover:text-cyan-300">
          {files.length > 0
            ? `${files.length} wafer image${files.length > 1 ? 's' : ''} selected`
            : 'Drop multiple wafer images here'}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {files.length > 0
            ? 'Click or drop additional wafer files to add to this lot'
            : 'Select or drag multiple wafer files to run simultaneous batch classification'}
        </p>
      </div>

      {/* Staged Files Preview */}
      {files.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Staged Wafers ({files.length})
            </span>
            <button
              type="button"
              onClick={clearAllFiles}
              className="text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <span
                key={`${file.name}-${idx}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200"
              >
                <span className="truncate max-w-[180px]">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(idx)
                  }}
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                  title="Remove wafer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Batch Processing Errors / Warnings */}
      {batchResult?.failed_count > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {batchResult.failed_count} wafer image{batchResult.failed_count > 1 ? 's' : ''} failed to process:
            </span>
          </div>
          <ul className="list-disc list-inside text-slate-300 ml-1 space-y-0.5">
            {batchResult.errors.map((err, idx) => (
              <li key={idx}>
                <span className="font-mono text-white">{err.filename}</span>: {err.error}
              </li>
            ))}
          </ul>
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
              {batchResult.total_processed > 0
                ? `${(100 - batchResult.defect_rate).toFixed(1)}%`
                : '0.0%'}
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
                            src={getBackendUrl(row.image_url)}
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
