import React from 'react'
import {
  Cpu,
  Microchip,
  Sparkles,
  Layers,
  BookOpen,
  Code2,
  Database,
  Eye,
  CheckCircle2
} from 'lucide-react'

export default function AboutProject() {
  const defectClasses = [
    {
      name: 'Normal',
      cause: 'Cleanroom Baseline',
      desc: 'Uniform die patterns with normal yield. No systematic spatial defect clusters detected across the silicon wafer disc.'
    },
    {
      name: 'Center',
      cause: 'CVD & Center CMP Bias',
      desc: 'Dense defect cluster concentrated in the center dies. Induced by chemical vapor deposition gas non-uniformity or center-biased polishing pressure.'
    },
    {
      name: 'Donut',
      cause: 'Thermal Annealing / Slurry Dynamics',
      desc: 'Annular ring of defective dies situated between center and periphery. Corresponds to temperature gradients during furnace annealing or fluid pooling.'
    },
    {
      name: 'Edge-Loc',
      cause: 'Handling Pins & Robotics Clamping',
      desc: 'Localized defect cluster situated along the perimeter edge/bevel. Commonly caused by robot end-effector pincers, vacuum wands, or cassette contact.'
    },
    {
      name: 'Edge-Ring',
      cause: 'Edge Bead Removal (EBR) / Spin-off',
      desc: 'Continuous or semi-continuous ring of defective dies along the circumference. Typical of photoresist buildup or edge bead solvent dispensing failure.'
    },
    {
      name: 'Loc',
      cause: 'Localized Contamination / Reticle Mask',
      desc: 'Localized off-center defect patch. Results from localized micro-droplets, localized etch anomalies, or photolithography reticle dust.'
    },
    {
      name: 'Near-full',
      cause: 'Catastrophic Process Failure',
      desc: 'Extensive defect coverage spanning majority of dies across the wafer. Indicates severe chamber breakdown, furnace runaway, or massive contamination.'
    },
    {
      name: 'Random',
      cause: 'Airborne Airborne Particles / Substrate Voids',
      desc: 'Uniformly scattered point defects without spatial clustering. Arises from random airborne cleanroom particulate matter or silicon crystal point defects.'
    },
    {
      name: 'Scratch',
      cause: 'Mechanical Tool Handling / CMP Particles',
      desc: 'Linear or curvilinear defect trail. Direct indication of abrasive slurry particles dragging across the wafer or automated robotic tweezers slipping.'
    }
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Intro */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Academic Capstone Project &bull; 2026
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Semiconductor Wafer Defect Detection & Explainable AI
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          An end-to-end intelligent computer vision platform engineered to automate semiconductor wafer-map defect classification and provide interpretable visual heatmaps via Gradient-weighted Class Activation Mapping (Grad-CAM).
        </p>
      </div>

      {/* 9 Canonical Classes Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Microchip className="w-5 h-5 text-cyan-400" />
          The 9 Semiconductor Wafer Defect Classes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {defectClasses.map((item, idx) => (
            <div
              key={item.name}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">
                  {idx + 1}. {item.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                  {item.cause}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Explainable AI: Grad-CAM Formulation */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          Explainable AI: Grad-CAM Formulation
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          To ensure transparency in semiconductor cleanroom automated inspection, we utilize Gradient-weighted Class Activation Mapping (Grad-CAM) to visualize which spatial regions of the wafer map most strongly activated the CNN's classification score.
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 space-y-2">
          <div>1. Feature Map Gradients: &alpha;<sub>k</sub><sup>c</sup> = (1/Z) &Sigma;<sub>i</sub> &Sigma;<sub>j</sub> (&part;y<sup>c</sup> / &part;A<sub>ij</sub><sup>k</sup>)</div>
          <div>2. Weighted Activation Map: L<sub>Grad-CAM</sub><sup>c</sup> = ReLU(&Sigma;<sub>k</sub> &alpha;<sub>k</sub><sup>c</sup> A<sup>k</sup>)</div>
          <div>3. Bilinear interpolation & Jet colormap blending onto original wafer map</div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          System Architecture & Tech Stack
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
              <Cpu className="w-4 h-4" />
              Machine Learning Pipeline
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>&bull; PyTorch 2.x Deep Learning</li>
              <li>&bull; Torchvision transforms</li>
              <li>&bull; Scikit-learn validation & metrics</li>
              <li>&bull; Matplotlib matrix generation</li>
              <li>&bull; Grad-CAM PyTorch hooks</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <Code2 className="w-4 h-4" />
              Backend REST API
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>&bull; FastAPI & Uvicorn</li>
              <li>&bull; SQLite & SQLAlchemy ORM</li>
              <li>&bull; Pydantic v2 data schemas</li>
              <li>&bull; Multipart file upload pipeline</li>
              <li>&bull; CORS & Static file hosting</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
              <Database className="w-4 h-4" />
              Frontend Dashboard
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>&bull; React 18 + Vite</li>
              <li>&bull; Tailwind CSS Cleanroom theme</li>
              <li>&bull; Lucide-react iconography</li>
              <li>&bull; Dual-mode Grad-CAM overlay</li>
              <li>&bull; CSV Lot export engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
