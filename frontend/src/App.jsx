import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import SingleInspection from './pages/SingleInspection'
import BatchInspection from './pages/BatchInspection'
import PredictionHistory from './pages/PredictionHistory'
import ModelMetrics from './pages/ModelMetrics'
import AboutProject from './pages/AboutProject'
import { checkHealth } from './services/api'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [health, setHealth] = useState(null)
  const [isBackendOnline, setIsBackendOnline] = useState(false)

  const verifyHealth = async () => {
    try {
      const data = await checkHealth()
      setHealth(data)
      setIsBackendOnline(true)
    } catch (err) {
      setIsBackendOnline(false)
    }
  }

  useEffect(() => {
    verifyHealth()
    const interval = setInterval(verifyHealth, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      <Navbar health={health} isBackendOnline={isBackendOnline} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'single' && <SingleInspection />}
          {activeTab === 'batch' && <BatchInspection />}
          {activeTab === 'history' && <PredictionHistory />}
          {activeTab === 'metrics' && <ModelMetrics />}
          {activeTab === 'about' && <AboutProject />}
        </main>
      </div>
    </div>
  )
}
