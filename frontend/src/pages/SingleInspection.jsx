import React, { useState, useEffect, useRef } from 'react'
import {
  UploadCloud,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  Sliders,
  Sparkles,
  Info,
  RefreshCw,
  Eye,
  Check
} from 'lucide-react'
import { predictSingle, getSamples } from '../services/api'

export default function SingleInspection() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [samples, setSamples] = useState([])
  const [activeSample, setActiveSample] = useState(null)
  const [overlayAlpha, setOverlayAlpha] = useState(50)
  const [viewMode, setViewMode] = useState('side-by-side') // 'side-by-side' or 'blended'
  const fileInputRef = useRef(null)

  useEffect(() => {
    getSamples()
      .then((data) => setSamples(data))
      .catch((err) => console.log('Samples not yet ready:', err))
  }, [])

  const handleFileSelect = (file) => {
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setActiveSample(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const loadSampleWafer = async (sample) => {
    try {
      setActiveSample(sample.class_name)
      setError(null)
      const res = await fetch(sample.image_url)
      const blob = await res.blob()
      const file = new File([blob], sample.filename, { type: 'image/png' })
      handleFileSelect(file)
      setActiveSample(sample.class_name)
    } catch (err) {
      setError(`Failed to load sample: ${err.message}`)
    }
  }

  const runPrediction = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    try {
      const data = await predictSingle(selectedFile)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Failed to complete wafer prediction.')
    } finally {
      setLoading(false)
    }
  }

  const isDefective = result?.is_defective

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Single Wafer Inspection & Explainable AI
          <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Grad-CAM
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Upload a silicon wafer map image or select a sample preset to detect defect classes and generate gradient heatmaps.
        </p>
      </div>

      {/* Preset Samples Selector */}
      {samples.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Quick Test Presets (All 9 Defect Types):
            </span>
            <span className="text-[11px] text-slate-400">Click to instantly load</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samples.map((s) => (
              <button
                key={s.class_name}
                onClick={() => loadSampleWafer(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                  activeSample === s.class_name
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <span>{s.class_name}</span>
                {activeSample === s.class_name && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Upload & Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dropzone & Action */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="p-8 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[260px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <div className="w-14 h-14 rounded-2xl bg-slate-800 group-hover:bg-cyan-500/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="text-sm font-semibold text-white group-hover:text-cyan-300">
              {selectedFile ? selectedFile.name : 'Drop wafer map image here'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              or click to browse from your device (.png, .jpg, .bmp)
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={runPrediction}
            disabled={!selectedFile || loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              !selectedFile || loading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running WaferCNN & Grad-CAM...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run AI Defect Inspection</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Visualization & Grad-CAM */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                Wafer Map & Spatial Heatmap Visualization
              </h3>

              {result && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === 'side-by-side' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setViewMode('blended')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === 'blended' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Blend Overlay
                  </button>
                </div>
              )}
            </div>

            {previewUrl ? (
              <div className="space-y-4">
                {viewMode === 'side-by-side' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Original */}
                    <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-xs font-mono text-slate-400 mb-2">Original Wafer Map</span>
                      <img
                        src={previewUrl}
                        alt="Original Wafer"
                        className="w-48 h-48 rounded-lg object-contain bg-black border border-slate-800"
                      />
                    </div>

                    {/* Heatmap */}
                    <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-xs font-mono text-cyan-400 mb-2">Grad-CAM Heatmap</span>
                      {result?.heatmap_url ? (
                        <img
                          src={result.heatmap_url}
                          alt="Grad-CAM Heatmap"
                          className="w-48 h-48 rounded-lg object-contain bg-black border border-cyan-500/30 glow-cyan"
                        />
                      ) : (
                        <div className="w-48 h-48 rounded-lg bg-slate-900 border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                          <Clock className="w-6 h-6 text-slate-600 mb-2" />
                          <span>Run inspection to generate Grad-CAM overlay</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Blended overlay view with slider */
                  <div className="space-y-4 flex flex-col items-center p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="relative w-56 h-56 rounded-xl overflow-hidden border border-slate-700 bg-black">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      {result?.heatmap_url && (
                        <img
                          src={result.heatmap_url}
                          alt="Overlay"
                          className="absolute inset-0 w-full h-full object-contain mix-blend-screen transition-opacity"
                          style={{ opacity: overlayAlpha / 100 }}
                        />
                      )}
                    </div>

                    {result?.heatmap_url && (
                      <div className="w-full max-w-xs space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Heatmap Blend Opacity</span>
                          <span className="font-mono text-cyan-400">{overlayAlpha}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={overlayAlpha}
                          onChange={(e) => setOverlayAlpha(Number(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                <span>Select an image or click a sample preset to view wafer</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prediction Results & Explanation */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Main Result Card */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Diagnosis</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isDefective
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {isDefective ? 'Defective' : 'Normal Wafer'}
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-0.5">Predicted Class</div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {result.predicted_class}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Confidence</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-400">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Latency</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-teal-300">
                    {result.inference_time_ms} ms
                  </div>
                </div>
              </div>
            </div>

            {/* Engineering Defect Description */}
            <div className="mt-4 p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-900/40 text-xs">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Fab Root Cause Insight:</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {result.defect_description}
              </p>
            </div>
          </div>

          {/* 9-Class Probability Bar Chart */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Full 9-Class Probability Distribution</h3>
              <span className="text-xs font-mono text-slate-400">Softmax Output</span>
            </div>

            <div className="space-y-2.5">
              {result.probabilities &&
                Object.entries(result.probabilities).map(([cls, prob]) => {
                  const isTop = cls === result.predicted_class
                  const pct = (prob * 100).toFixed(2)
                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span
                          className={`font-medium ${
                            isTop ? 'text-cyan-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {cls}
                        </span>
                        <span
                          className={`font-mono ${
                            isTop ? 'text-cyan-400 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50' : 'bg-slate-600'
                          }`}
                          style={{ width: `${Math.max(prob * 100, 1)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
