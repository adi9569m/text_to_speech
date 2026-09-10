import React, { useState, useEffect } from 'react'
import axios from 'axios'
import {
  Volume2,
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Languages,
  Mic,
  Play,
  Download,
  Trash2,
  Copy
} from 'lucide-react'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const [text, setText] = useState('Hello! Welcome to the Text-to-Speech application. Convert your written text into natural-sounding speech.')
  const [charLimit] = useState(1000)

  // Character and word count
  const charCount = text.length
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  // Check backend health
  const checkHealth = async () => {
    setBackendStatus('checking')
    try {
      const response = await axios.get('/api/health', { timeout: 3000 })
      if (response.data && response.data.status === 'ok') {
        setBackendStatus('online')
      } else {
        setBackendStatus('offline')
      }
    } catch {
      setBackendStatus('offline')
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4 sm:px-6">
      {/* Container */}
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Full-Stack Speech Synthesis
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            Text to Speech Application
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Convert written text into natural-sounding speech across multiple languages and voices with instant playback and export.
          </p>
        </header>

        {/* System Health Status Bar (Day 1 Feature) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 px-4 flex items-center justify-between text-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Backend API Status:</span>
            {backendStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Online (FastAPI :8000)
              </span>
            )}
            {backendStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                Backend Offline (Start Uvicorn)
              </span>
            )}
            {backendStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Checking /api/health...
              </span>
            )}
          </div>
          <button
            onClick={checkHealth}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Main Card */}
        <main className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Text Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tts-text" className="text-sm font-semibold text-slate-200">
                Enter your text
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                  title="Clear text"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="tts-text"
                rows={5}
                value={text}
                maxLength={charLimit}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste text here to convert into speech..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y"
              />
            </div>

            {/* Character and Word Counter */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Words: <strong className="text-slate-200">{wordCount}</strong></span>
              <span>
                Characters:{' '}
                <strong className={charCount > charLimit * 0.9 ? 'text-amber-400' : 'text-slate-200'}>
                  {charCount}
                </strong>{' '}
                / {charLimit}
              </span>
            </div>
          </div>

          {/* Configuration Grid: Language & Voice Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Language Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                Language
              </label>
              <select
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none cursor-not-allowed opacity-80"
              >
                <option>English (US)</option>
                <option>Hindi (India)</option>
                <option>Gujarati (India)</option>
                <option>Marathi (India)</option>
                <option>Spanish (Spain)</option>
                <option>French (France)</option>
                <option>German (Germany)</option>
              </select>
            </div>

            {/* Voice Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                Voice
              </label>
              <select
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-300 focus:outline-none cursor-not-allowed opacity-80"
              >
                <option>Jenny (Female - Neural)</option>
                <option>Guy (Male - Neural)</option>
              </select>
            </div>
          </div>

          {/* Action Button */}
          <div>
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl bg-indigo-600/70 hover:bg-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed transition shadow-lg shadow-indigo-600/20"
            >
              <Volume2 className="w-4 h-4" />
              Generate Speech (Available Day 2)
            </button>
          </div>

          {/* Generated Audio Placeholder */}
          <div className="border-t border-slate-800/80 pt-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Generated Audio
            </h3>
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <Volume2 className="w-6 h-6 text-slate-600" />
              <span>Audio player will appear here after synthesis is triggered.</span>
            </div>
          </div>

        </main>

        {/* Day 1 Milestone Card */}
        <footer className="text-center text-xs text-slate-500 space-y-1">
          <p>
            Text-to-Speech Application • Project Submission Deadline: <strong>Sept 20, 2026</strong>
          </p>
          <p className="text-slate-600">
            Day 1 Architecture & Scaffold completed: Git, FastAPI, Pydantic, Vite React & Tailwind CSS.
          </p>
        </footer>

      </div>
    </div>
  )
}

export default App
