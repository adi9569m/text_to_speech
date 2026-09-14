import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import {
  Volume2,
  Sparkles,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Languages,
  Mic,
  Download,
  Trash2,
  Copy,
  Check,
  Gauge,
  Music,
  History,
  Clock,
  RotateCcw,
} from 'lucide-react'

// Initial fallback voices while fetching from API
const INITIAL_VOICES = [
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (Female)',
    gender: 'Female',
    language: 'English (US)',
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (Male)',
    gender: 'Male',
    language: 'English (US)',
  },
  {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara (Female)',
    gender: 'Female',
    language: 'Hindi (India)',
  },
  {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur (Male)',
    gender: 'Male',
    language: 'Hindi (India)',
  },
  {
    id: 'gu-IN-DhwaniNeural',
    name: 'Dhwani (Female)',
    gender: 'Female',
    language: 'Gujarati (India)',
  },
  {
    id: 'mr-IN-AarohiNeural',
    name: 'Aarohi (Female)',
    gender: 'Female',
    language: 'Marathi (India)',
  },
  {
    id: 'es-ES-ElviraNeural',
    name: 'Elvira (Female)',
    gender: 'Female',
    language: 'Spanish (Spain)',
  },
  {
    id: 'fr-FR-DeniseNeural',
    name: 'Denise (Female)',
    gender: 'Female',
    language: 'French (France)',
  },
  {
    id: 'de-DE-KatjaNeural',
    name: 'Katja (Female)',
    gender: 'Female',
    language: 'German (Germany)',
  },
]

const SPEED_OPTIONS = [
  { label: '0.75x (Slower)', rate: '-25%' },
  { label: '1.0x (Normal)', rate: '+0%' },
  { label: '1.25x (Faster)', rate: '+25%' },
  { label: '1.5x (Fast)', rate: '+50%' },
]

function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [text, setText] = useState(
    'Hello! Welcome to the Text-to-Speech application. Convert your written text into natural-sounding speech.'
  )
  const charLimit = 1000

  // Voice and language states
  const [languages, setLanguages] = useState([
    'English (US)',
    'Hindi (India)',
    'Gujarati (India)',
    'Marathi (India)',
    'Spanish (Spain)',
    'French (France)',
    'German (Germany)',
  ])
  const [allVoices, setAllVoices] = useState(INITIAL_VOICES)
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)')
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural')
  const [selectedSpeed, setSelectedSpeed] = useState('+0%')

  // Audio generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [copied, setCopied] = useState(false)

  // Speech history states (Day 4 feature)
  const [historyItems, setHistoryItems] = useState([])
  const [totalHistory, setTotalHistory] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  const [copiedHistoryId, setCopiedHistoryId] = useState(null)

  const audioRef = useRef(null)

  // Character and word counts
  const charCount = text.length
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  // Filter voices for current language
  const availableVoices = allVoices.filter(
    (voice) => voice.language === selectedLanguage
  )

  // Format ISO timestamp cleanly
  const formatDate = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  // Check backend health
  const checkHealth = async () => {
    try {
      const response = await axios.get('/api/health', { timeout: 3000 })
      if (response.data?.status === 'ok') {
        setBackendStatus('online')
      } else {
        setBackendStatus('offline')
      }
    } catch {
      setBackendStatus('offline')
    }
  }

  // Fetch supported voices list
  const fetchVoices = async () => {
    try {
      const response = await axios.get('/api/voices', { timeout: 3500 })
      if (response.data?.voices) {
        setAllVoices(response.data.voices)
      }
      if (response.data?.languages) {
        setLanguages(response.data.languages)
      }
    } catch {
      // Retain fallback voices if offline
    }
  }

  // Fetch speech generation history (Day 4 feature)
  const fetchHistory = async () => {
    setIsLoadingHistory(true)
    setHistoryError(null)
    try {
      const response = await axios.get('/api/history', { timeout: 4000 })
      if (response.data) {
        setHistoryItems(response.data.items || [])
        setTotalHistory(response.data.total || 0)
      }
    } catch {
      setHistoryError('Could not load history records from server.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Delete a single history item (Day 4 feature)
  const handleDeleteHistoryItem = async (id) => {
    try {
      await axios.delete(`/api/history/${id}`)
      setHistoryItems((prev) => prev.filter((item) => item.id !== id))
      setTotalHistory((prev) => Math.max(0, prev - 1))
    } catch {
      setHistoryError('Failed to delete history item.')
    }
  }

  // Clear all history items (Day 4 feature)
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all speech history?')) {
      return
    }
    try {
      await axios.delete('/api/history')
      setHistoryItems([])
      setTotalHistory(0)
    } catch {
      setHistoryError('Failed to clear speech history.')
    }
  }

  // Copy audio URL for history item (Day 4 feature)
  const handleCopyHistoryUrl = (item) => {
    const url = `${window.location.origin}${item.audio_url}`
    navigator.clipboard.writeText(url)
    setCopiedHistoryId(item.id)
    setTimeout(() => setCopiedHistoryId(null), 2000)
  }

  // Reuse history item text in the main input textarea (Day 4 feature)
  const handleUseHistoryText = (itemText) => {
    setText(itemText)
    setErrorMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRefresh = () => {
    setBackendStatus('checking')
    checkHealth()
    fetchVoices()
    fetchHistory()
  }

  useEffect(() => {
    checkHealth()
    fetchVoices()
    fetchHistory()
  }, [])

  // Switch voice when language changes
  const handleLanguageChange = (e) => {
    const nextLang = e.target.value
    setSelectedLanguage(nextLang)

    const matching = allVoices.filter((v) => v.language === nextLang)
    if (matching.length > 0) {
      setSelectedVoice(matching[0].id)
    }
  }

  // Trigger speech synthesis
  const handleGenerate = async () => {
    const input = text.trim()
    if (!input) {
      setErrorMessage('Please enter some text to generate speech.')
      return
    }

    if (input.length > charLimit) {
      setErrorMessage(`Text exceeds maximum allowed limit of ${charLimit} characters.`)
      return
    }

    setIsGenerating(true)
    setErrorMessage(null)

    try {
      const res = await axios.post('/api/tts', {
        text: input,
        language: selectedLanguage,
        voice: selectedVoice,
        rate: selectedSpeed,
        pitch: '+0Hz',
        volume: '+0%',
      })

      setGeneratedAudio(res.data)

      // Refresh history list so newly generated audio appears immediately
      fetchHistory()

      // Play audio automatically if permitted
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load()
          audioRef.current.play().catch(() => {})
        }
      }, 100)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate audio. Check backend connection.'
      setErrorMessage(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy audio direct URL
  const handleCopy = () => {
    if (!generatedAudio) return
    const url = `${window.location.origin}${generatedAudio.audio_url}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4 sm:px-6">
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
            Convert written text into natural-sounding speech across multiple languages with instant playback and export.
          </p>
        </header>

        {/* Health status banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 px-4 flex items-center justify-between text-sm backdrop-blur">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Backend API:</span>

            {backendStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Online
              </span>
            )}

            {backendStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                Offline
              </span>
            )}

            {backendStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Checking...
              </span>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Main card */}
        <main className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

          {/* Text input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tts-text" className="text-sm font-semibold text-slate-200">
                Enter text
              </label>

              <button
                type="button"
                onClick={() => setText('')}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                title="Clear input"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>

            <textarea
              id="tts-text"
              rows={5}
              value={text}
              maxLength={charLimit}
              onChange={(e) => {
                setText(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="Type or paste your text here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y"
            />

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                Words: <strong className="text-slate-200">{wordCount}</strong>
              </span>

              <span>
                Characters:{' '}
                <strong className={charCount > charLimit * 0.9 ? 'text-amber-400' : 'text-slate-200'}>
                  {charCount}
                </strong>{' '}
                / {charLimit}
              </span>
            </div>
          </div>

          {/* Controls: Language, Voice, and Speed */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            {/* Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                Language
              </label>

              <select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang} className="bg-slate-950 text-slate-200">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Voice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-indigo-400" />
                Voice
              </label>

              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id} className="bg-slate-950 text-slate-200">
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                Speed
              </label>

              <select
                value={selectedSpeed}
                onChange={(e) => setSelectedSpeed(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {SPEED_OPTIONS.map((opt) => (
                  <option key={opt.rate} value={opt.rate} className="bg-slate-950 text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit action */}
          <div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || text.trim() === ''}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition ${
                isGenerating || text.trim() === ''
                  ? 'bg-indigo-600/40 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-[0.99]'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating audio...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Generate Speech
                </>
              )}
            </button>
          </div>

          {/* Audio player / output card */}
          <div className="border-t border-slate-800/80 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                Audio Output
              </h3>

              {generatedAudio && (
                <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              )}
            </div>

            {generatedAudio ? (
              <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-4 space-y-3">
                <audio
                  ref={audioRef}
                  controls
                  className="w-full h-10 rounded-lg focus:outline-none"
                  src={generatedAudio.audio_url}
                >
                  Your browser does not support audio playback.
                </audio>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Voice: <strong className="text-slate-200">{generatedAudio.voice}</strong></span>
                    <span>•</span>
                    <span>{generatedAudio.char_count} chars</span>
                    <span>•</span>
                    <span>{generatedAudio.word_count} words</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                      title="Copy direct audio URL"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={generatedAudio.audio_url}
                      download={generatedAudio.filename}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                <Volume2 className="w-7 h-7 text-slate-600" />
                <span className="text-slate-400">No audio generated yet</span>
                <span className="text-xs text-slate-500">
                  Select your voice and click "Generate Speech" above.
                </span>
              </div>
            )}
          </div>

        </main>

        {/* Speech History Card (Day 4 Feature) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-100">Speech History</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
                    {totalHistory}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Previously generated speech stored in database
                </p>
              </div>
            </div>

            {historyItems.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
                title="Clear all audio history records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>

          {/* Error banner for history actions */}
          {historyError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{historyError}</span>
            </div>
          )}

          {/* Loading state */}
          {isLoadingHistory && historyItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Loading speech history...</span>
            </div>
          ) : historyItems.length === 0 ? (
            /* Empty state */
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <History className="w-7 h-7 text-slate-600" />
              <span className="text-slate-400 font-medium">No speech history yet</span>
              <span className="text-xs text-slate-500">
                Generated audio clips are automatically saved and will appear here.
              </span>
            </div>
          ) : (
            /* History list */
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-4 space-y-3 transition"
                >
                  {/* Top: Text snippet & delete */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-200 leading-relaxed font-normal">
                      &ldquo;{item.text}&rdquo;
                    </p>
                    <button
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-800/80 transition cursor-pointer shrink-0"
                      title="Delete history item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badges and timestamp */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                      <Mic className="w-3 h-3 text-indigo-400" />
                      {item.voice}
                    </span>
                    {item.language && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        <Languages className="w-3 h-3 text-slate-400" />
                        {item.language}
                      </span>
                    )}
                    <span className="text-slate-500 flex items-center gap-1 text-[11px] ml-auto">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {formatDate(item.created_at)}
                    </span>
                  </div>

                  {/* Audio player */}
                  <audio
                    controls
                    className="w-full h-9 rounded-lg focus:outline-none"
                    src={item.audio_url}
                    preload="none"
                  >
                    Your browser does not support audio playback.
                  </audio>

                  {/* Actions: Load Text, Copy Link, Download */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-900 text-xs">
                    <button
                      onClick={() => handleUseHistoryText(item.text)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                      title="Load this text into input"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Load Text</span>
                    </button>

                    <button
                      onClick={() => handleCopyHistoryUrl(item)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                      title="Copy direct audio URL"
                    >
                      {copiedHistoryId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.audio_url}
                      download
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 space-y-1">
          <p>
            Text-to-Speech Application • Project Submission Deadline: <strong>Sept 21, 2026</strong>
          </p>
          <p className="text-slate-600">
            Day 4 Completed: Speech History Frontend Integration & Text Validation.
          </p>
        </footer>

      </div>
    </div>
  )
}

export default App
