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
  Star,
  SlidersHorizontal,
  Volume1,
  Upload,
  FileText,
  X,
  User,
  LogIn,
  LogOut,
  Lock,
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

const PITCH_OPTIONS = [
  { label: '-20Hz (Lower)', value: '-20Hz' },
  { label: '-10Hz (Low)', value: '-10Hz' },
  { label: '+0Hz (Normal)', value: '+0Hz' },
  { label: '+10Hz (High)', value: '+10Hz' },
  { label: '+20Hz (Higher)', value: '+20Hz' },
]

const VOLUME_OPTIONS = [
  { label: '50% (Soft)', value: '-50%' },
  { label: '75% (Medium)', value: '-25%' },
  { label: '100% (Normal)', value: '+0%' },
  { label: '125% (Loud)', value: '+25%' },
  { label: '150% (Max)', value: '+50%' },
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

  // Audio Customization states (Day 5 feature)
  const [selectedSpeed, setSelectedSpeed] = useState('+0%')
  const [selectedPitch, setSelectedPitch] = useState('+0Hz')
  const [selectedVolume, setSelectedVolume] = useState('+0%')

  // Favorites states (Day 5 feature)
  const [historyTab, setHistoryTab] = useState('all') // 'all' | 'favorites'
  const [favoriteVoices, setFavoriteVoices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tts_favorite_voices') || '[]')
    } catch {
      return []
    }
  })

  // Authentication states (Day 8 feature)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('tts_auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('tts_auth_token') || null
  })
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [authSuccessNotice, setAuthSuccessNotice] = useState(null)

  // Auth header helper
  const getAuthHeaders = () => {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {}
  }

  // Audio generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [copied, setCopied] = useState(false)

  // Document upload states & ref (Day 6 & Day 9 features)
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExtractingDoc, setIsExtractingDoc] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState(null)
  const [uploadNotice, setUploadNotice] = useState(null)

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
        setBackendStatus((prev) => {
          if (prev === 'offline') {
            fetchVoices()
            fetchHistory()
          }
          return 'online'
        })
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

  // Fetch speech generation history (Day 4 & Day 8 User Scoping)
  const fetchHistory = async () => {
    setIsLoadingHistory(true)
    setHistoryError(null)
    try {
      const response = await axios.get('/api/history', {
        headers: getAuthHeaders(),
        timeout: 4000,
      })
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

  // Delete a single history item (Day 4 & Day 8 User Scoping)
  const handleDeleteHistoryItem = async (id) => {
    try {
      await axios.delete(`/api/history/${id}`, { headers: getAuthHeaders() })
      setHistoryItems((prev) => prev.filter((item) => item.id !== id))
      setTotalHistory((prev) => Math.max(0, prev - 1))
    } catch {
      setHistoryError('Failed to delete history item.')
    }
  }

  // Clear all history items (Day 4 & Day 8 User Scoping)
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your speech history?')) {
      return
    }
    try {
      await axios.delete('/api/history', { headers: getAuthHeaders() })
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

  // Toggle favorite status of a voice (Day 5 feature)
  const handleToggleFavoriteVoice = (voiceId) => {
    setFavoriteVoices((prev) => {
      const next = prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId]
      try {
        localStorage.setItem('tts_favorite_voices', JSON.stringify(next))
      } catch {
        // Fallback if storage unavailable
      }
      return next
    })
  }

  // Toggle favorite status of a history item (Day 5 & Day 8 User Scoping)
  const handleToggleFavoriteItem = async (id) => {
    try {
      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
        )
      )
      await axios.patch(`/api/history/${id}/favorite`, {}, { headers: getAuthHeaders() })
    } catch {
      setHistoryError('Could not update favorite status on server.')
      fetchHistory()
    }
  }

  // Reuse history item text in the main input textarea (Day 4 feature)
  const handleUseHistoryText = (itemText) => {
    setText(itemText)
    setUploadedFileName(null)
    setUploadNotice(null)
    setErrorMessage(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Multi-format Document Upload Handlers (.txt, .pdf) (Day 6 & Day 9 features)
  const handleFileRead = async (file) => {
    if (!file) return

    const isValidDoc =
      file.name.match(/\.(txt|text|pdf)$/i) ||
      file.type === 'text/plain' ||
      file.type === 'application/pdf'

    if (!isValidDoc) {
      setErrorMessage('Please upload a supported document (.txt or .pdf).')
      return
    }

    setIsExtractingDoc(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('/api/extract-text', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders(),
        },
      })

      const data = response.data
      setText(data.text)
      setUploadedFileName(data.filename)

      let notice = `Imported "${data.filename}"`
      if (data.page_count > 1) {
        notice += ` (${data.page_count} pages`
      } else {
        notice += ` (${data.char_count} chars`
      }
      if (data.truncated) {
        notice += `, truncated to ${charLimit} max characters)`
      } else {
        notice += `)`
      }
      setUploadNotice(notice)
      setErrorMessage(null)
    } catch (err) {
      const detail =
        err.response?.data?.detail || 'Failed to extract text from document.'
      const statusCode = err.response?.status
      setErrorMessage({
        message: detail,
        code: statusCode,
        canRetry: false,
      })
    } finally {
      setIsExtractingDoc(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileRead(file)
    if (e.target) e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFileRead(file)
  }

  const handleClearText = () => {
    setText('')
    setUploadedFileName(null)
    setUploadNotice(null)
    setErrorMessage(null)
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

    // Resilient periodic background health polling every 10s (Day 7 feature)
    const pollInterval = setInterval(() => {
      checkHealth()
    }, 10000)

    return () => clearInterval(pollInterval)
  }, [])

  // Refetch history when authentication status changes (Day 8 feature)
  useEffect(() => {
    fetchHistory()
  }, [authToken])

  // Authentication Handlers (Day 8 feature)
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError(null)

    const username = authUsername.trim()
    if (!username) {
      setAuthError('Please enter a username.')
      return
    }
    if (authMode === 'register' && username.length < 3) {
      setAuthError('Username must be at least 3 characters.')
      return
    }
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      return
    }

    setAuthLoading(true)
    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const res = await axios.post(endpoint, {
        username,
        password: authPassword,
      })

      if (res.data?.success) {
        setCurrentUser(res.data.user)
        setAuthToken(res.data.token)
        localStorage.setItem('tts_auth_user', JSON.stringify(res.data.user))
        localStorage.setItem('tts_auth_token', res.data.token)

        setAuthSuccessNotice(
          authMode === 'register'
            ? `Account created! Welcome, ${res.data.user.username}.`
            : `Welcome back, ${res.data.user.username}!`
        )
        setTimeout(() => setAuthSuccessNotice(null), 4000)

        setAuthUsername('')
        setAuthPassword('')
        setIsAuthModalOpen(false)
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Authentication failed. Please check your credentials.'
      setAuthError(msg)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    setAuthToken(null)
    localStorage.removeItem('tts_auth_user')
    localStorage.removeItem('tts_auth_token')
    setAuthSuccessNotice('Signed out successfully.')
    setTimeout(() => setAuthSuccessNotice(null), 3000)
  }

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
      const res = await axios.post(
        '/api/tts',
        {
          text: input,
          language: selectedLanguage,
          voice: selectedVoice,
          rate: selectedSpeed,
          pitch: selectedPitch,
          volume: selectedVolume,
        },
        { headers: getAuthHeaders() }
      )

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
      const statusCode = err.response?.status
      let userMsg = 'Failed to generate audio. Check backend connection.'
      let canRetry = true

      if (!err.response) {
        userMsg = 'Network error: Cannot reach backend server. Please check if the server is running.'
        setBackendStatus('offline')
      } else if (statusCode === 400) {
        userMsg = err.response?.data?.detail || 'Invalid request parameters or unsupported voice selected.'
        canRetry = false
      } else if (statusCode === 422) {
        userMsg = 'Validation error: Text length must be between 1 and 1000 characters.'
        canRetry = false
      } else if (statusCode === 404) {
        userMsg = 'TTS service endpoint not found (HTTP 404).'
        canRetry = false
      } else if (statusCode === 500) {
        userMsg = err.response?.data?.detail || 'Internal server error occurred while synthesizing speech.'
      } else if (statusCode === 503) {
        userMsg = 'Speech synthesis engine is temporarily busy or unavailable. Please try again.'
      } else {
        userMsg = err.response?.data?.detail || `Error (${statusCode}): Unable to complete speech synthesis.`
      }

      setErrorMessage({
        message: userMsg,
        code: statusCode,
        canRetry,
      })
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
    <div className="min-h-screen bg-[#F8F7F4] text-slate-800 flex flex-col items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-3xl space-y-8">

        {/* Header */}
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0057FF]/10 border border-[#0057FF]/25 text-[#0057FF] text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#0057FF]" />
            Full-Stack Speech Synthesis
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Text to Speech Application
          </h1>

          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Convert written text into natural-sounding speech across multiple languages with instant playback and export.
          </p>
        </header>

        {/* Top bar: Health status and User Authentication (Day 8 feature) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 font-medium">Backend:</span>

            {backendStatus === 'online' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Online
              </span>
            )}

            {backendStatus === 'offline' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full" title="Attempting auto-reconnect every 10s">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Offline (Auto-reconnecting)
              </span>
            )}

            {backendStatus === 'checking' && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                Checking...
              </span>
            )}

            <button
              onClick={handleRefresh}
              className="text-xs text-slate-500 hover:text-[#0057FF] flex items-center gap-1 transition cursor-pointer font-medium ml-1 p-1 hover:bg-slate-100 rounded"
              title="Refresh connection & voices"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* User Account / Auth Widget (Day 8 Level 2 feature) */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-[#F8F7F4] border border-slate-200 px-2.5 py-1 rounded-lg">
                  <User className="w-3.5 h-3.5 text-[#0057FF]" />
                  <span className="font-semibold text-slate-900">{currentUser.username}</span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthError(null)
                  setAuthMode('login')
                  setIsAuthModalOpen(true)
                }}
                className="text-xs text-[#0057FF] hover:text-white font-medium flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0057FF]/10 hover:bg-[#0057FF] border border-[#0057FF]/25 transition cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Auth success / state notice */}
        {authSuccessNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between gap-2 shadow-sm">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {authSuccessNotice}
            </span>
            <button
              type="button"
              onClick={() => setAuthSuccessNotice(null)}
              className="text-emerald-600 hover:text-emerald-800 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main card */}
        <main className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">

          {/* Text input (with Day 6 File Upload support) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="tts-text" className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0057FF]" />
                Enter text
              </label>

              <div className="flex items-center gap-2">
                {/* Hidden file input for .txt and .pdf documents (Day 6 & Day 9 features) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.text,.pdf,text/plain,application/pdf"
                  className="hidden"
                />

                {/* Upload document button (Day 6 & Day 9 feature) */}
                <button
                  type="button"
                  disabled={isExtractingDoc}
                  onClick={() => fileInputRef.current?.click()}
                  className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition font-medium ${
                    isExtractingDoc
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'text-[#0057FF] hover:text-[#0047db] bg-[#0057FF]/10 hover:bg-[#0057FF]/15 border border-[#0057FF]/25 cursor-pointer'
                  }`}
                  title="Upload a .txt or .pdf document"
                >
                  {isExtractingDoc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Upload Document (.txt, .pdf)
                    </>
                  )}
                </button>

                {/* Clear input button */}
                <button
                  type="button"
                  onClick={handleClearText}
                  className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="Clear input"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            {/* Drag & drop wrapper */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl transition ${
                isDragging ? 'ring-2 ring-[#0057FF]' : ''
              }`}
            >
              <textarea
                id="tts-text"
                rows={5}
                value={text}
                maxLength={charLimit}
                onChange={(e) => {
                  setText(e.target.value)
                  if (errorMessage) setErrorMessage(null)
                  if (uploadNotice) setUploadNotice(null)
                }}
                placeholder="Type or paste your text here, or drag and drop a .txt or .pdf document..."
                className="w-full bg-[#F8F7F4]/60 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057FF] focus:border-transparent transition resize-y"
              />

              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-white/95 border-2 border-dashed border-[#0057FF] rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none text-[#0057FF] text-sm">
                  <Upload className="w-8 h-8 animate-bounce text-[#0057FF]" />
                  <span className="font-medium">Drop your .txt or .pdf document here to extract text</span>
                </div>
              )}
            </div>

            {/* File upload success/info notice */}
            {uploadNotice && (
              <div className="p-2.5 px-3 bg-[#0057FF]/10 border border-[#0057FF]/20 rounded-xl text-[#0057FF] text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-[#0057FF] shrink-0" />
                  {uploadNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setUploadNotice(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  title="Dismiss notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Words: <strong className="text-slate-700">{wordCount}</strong>
              </span>

              <span>
                Characters:{' '}
                <strong className={charCount > charLimit * 0.9 ? 'text-amber-600' : 'text-slate-700'}>
                  {charCount}
                </strong>{' '}
                / {charLimit}
              </span>
            </div>
          </div>

          {/* Controls: Language, Voice, and Audio Customization */}
          <div className="space-y-4">
            {/* Language and Voice Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-[#0057FF]" />
                  Language
                </label>

                <select
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057FF] cursor-pointer shadow-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang} className="bg-white text-slate-800">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice with Favorite toggle (Day 5 feature) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#0057FF]" />
                    Voice
                  </label>

                  <button
                    type="button"
                    onClick={() => handleToggleFavoriteVoice(selectedVoice)}
                    className={`text-xs flex items-center gap-1 px-1.5 py-0.5 rounded transition cursor-pointer font-medium ${
                      favoriteVoices.includes(selectedVoice)
                        ? 'text-amber-700 bg-amber-50 border border-amber-200'
                        : 'text-slate-500 hover:text-amber-600'
                    }`}
                    title={
                      favoriteVoices.includes(selectedVoice)
                        ? 'Favorited voice (click to remove)'
                        : 'Mark voice as favorite'
                    }
                  >
                    <Star
                      className={`w-3 h-3 ${
                        favoriteVoices.includes(selectedVoice) ? 'fill-amber-500 text-amber-500' : ''
                      }`}
                    />
                    <span>
                      {favoriteVoices.includes(selectedVoice) ? 'Favorited' : 'Favorite'}
                    </span>
                  </button>
                </div>

                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057FF] cursor-pointer shadow-sm"
                >
                  {availableVoices.map((v) => {
                    const isFav = favoriteVoices.includes(v.id)
                    return (
                      <option key={v.id} value={v.id} className="bg-white text-slate-800">
                        {isFav ? `★ ${v.name}` : v.name}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Audio Customization: Speed, Pitch, Volume (Day 5 feature) */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <SlidersHorizontal className="w-3 h-3 text-[#0057FF]" />
                Audio Customization
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Speed */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-[#0057FF]" />
                    Speed
                  </label>
                  <select
                    value={selectedSpeed}
                    onChange={(e) => setSelectedSpeed(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057FF] cursor-pointer shadow-sm"
                  >
                    {SPEED_OPTIONS.map((opt) => (
                      <option key={opt.rate} value={opt.rate} className="bg-white text-slate-800">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pitch */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-[#0057FF]" />
                    Pitch
                  </label>
                  <select
                    value={selectedPitch}
                    onChange={(e) => setSelectedPitch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057FF] cursor-pointer shadow-sm"
                  >
                    {PITCH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Volume */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                    <Volume1 className="w-3 h-3 text-[#0057FF]" />
                    Volume
                  </label>
                  <select
                    value={selectedVolume}
                    onChange={(e) => setSelectedVolume(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057FF] cursor-pointer shadow-sm"
                  >
                    {VOLUME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error notice (resilient error handling with status code badge & retry button) */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{typeof errorMessage === 'object' ? errorMessage.message : errorMessage}</span>
                {typeof errorMessage === 'object' && errorMessage.code && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-800 font-mono shrink-0">
                    HTTP {errorMessage.code}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {typeof errorMessage === 'object' && errorMessage.canRetry && (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-500 hover:text-rose-800 cursor-pointer p-0.5"
                  title="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Submit action */}
          <div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || text.trim() === ''}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition ${
                isGenerating || text.trim() === ''
                  ? 'bg-[#0057FF]/40 text-white/80 cursor-not-allowed'
                  : 'bg-[#0057FF] hover:bg-[#0047db] text-white cursor-pointer shadow-md shadow-[#0057FF]/25 active:scale-[0.99]'
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
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[#0057FF]" />
                Audio Output
              </h3>

              {generatedAudio && (
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              )}
            </div>

            {generatedAudio ? (
              <div className="bg-[#F8F7F4]/90 border border-[#0057FF]/20 rounded-xl p-4 space-y-3">
                <audio
                  ref={audioRef}
                  controls
                  className="w-full h-10 rounded-lg focus:outline-none"
                  src={generatedAudio.audio_url}
                >
                  Your browser does not support audio playback.
                </audio>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Voice: <strong className="text-slate-800">{generatedAudio.voice}</strong></span>
                    <span>•</span>
                    <span>{generatedAudio.char_count} chars</span>
                    <span>•</span>
                    <span>{generatedAudio.word_count} words</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-sm font-medium"
                      title="Copy direct audio URL"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={generatedAudio.audio_url}
                      download={generatedAudio.filename}
                      className="px-3 py-1.5 rounded-lg bg-[#0057FF] hover:bg-[#0047db] text-white font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#F8F7F4]/60 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                <Volume2 className="w-7 h-7 text-slate-400" />
                <span className="text-slate-600 font-medium">No audio generated yet</span>
                <span className="text-xs text-slate-400">
                  Select your voice and click "Generate Speech" above.
                </span>
              </div>
            )}
          </div>

        </main>

        {/* Speech History Card (Day 4 & Day 5 Features) */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#0057FF]/10 border border-[#0057FF]/20 text-[#0057FF]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Speech History</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#0057FF]/10 border border-[#0057FF]/25 text-[#0057FF] font-semibold">
                    {totalHistory}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {currentUser ? (
                    <>Personal history for <strong className="text-slate-700">{currentUser.username}</strong></>
                  ) : (
                    <>
                      Guest speech history •{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthError(null)
                          setAuthMode('login')
                          setIsAuthModalOpen(true)
                        }}
                        className="text-[#0057FF] hover:underline font-medium cursor-pointer"
                      >
                        Sign in
                      </button>{' '}
                      to save across sessions
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Filter Tabs and Clear Action (Day 5 feature) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#F8F7F4] p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setHistoryTab('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    historyTab === 'all'
                      ? 'bg-[#0057FF] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({historyItems.length})
                </button>
                <button
                  onClick={() => setHistoryTab('favorites')}
                  className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    historyTab === 'favorites'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200 shadow-sm'
                      : 'text-slate-600 hover:text-amber-600'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  Favorites ({historyItems.filter((i) => i.is_favorite).length})
                </button>
              </div>

              {historyItems.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 border border-rose-200 transition cursor-pointer font-medium"
                  title="Clear all audio history records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Error banner for history actions */}
          {historyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{historyError}</span>
            </div>
          )}

          {/* Loading state */}
          {isLoadingHistory && historyItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0057FF]" />
              <span>Loading speech history...</span>
            </div>
          ) : historyItems.length === 0 ? (
            /* Empty state */
            <div className="bg-[#F8F7F4]/60 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <History className="w-7 h-7 text-slate-400" />
              <span className="text-slate-700 font-medium">No speech history yet</span>
              <span className="text-xs text-slate-400">
                Generated audio clips are automatically saved and will appear here.
              </span>
            </div>
          ) : historyTab === 'favorites' &&
            historyItems.filter((i) => i.is_favorite).length === 0 ? (
            /* Empty favorites filter state */
            <div className="bg-[#F8F7F4]/60 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <Star className="w-7 h-7 text-slate-400" />
              <span className="text-slate-700 font-medium">No favorite audio yet</span>
              <span className="text-xs text-slate-400">
                Click the star icon on any speech card to add it to your favorites.
              </span>
            </div>
          ) : (
            /* History list */
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {historyItems
                .filter((item) => (historyTab === 'favorites' ? item.is_favorite : true))
                .map((item) => (
                  <div
                    key={item.id}
                    className={`bg-[#F8F7F4]/60 border rounded-xl p-4 space-y-3 transition ${
                      item.is_favorite
                        ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
                        : 'border-slate-200 hover:border-[#0057FF]/30'
                    }`}
                  >
                    {/* Top: Text snippet & actions (Favorite + Delete) */}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-800 leading-relaxed font-normal">
                        &ldquo;{item.text}&rdquo;
                      </p>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Favorite star toggle (Day 5 feature) */}
                        <button
                          onClick={() => handleToggleFavoriteItem(item.id)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            item.is_favorite
                              ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                          }`}
                          title={
                            item.is_favorite
                              ? 'Favorited (click to unfavorite)'
                              : 'Mark as favorite'
                          }
                        >
                          <Star
                            className={`w-4 h-4 ${
                              item.is_favorite ? 'fill-amber-500 text-amber-500' : ''
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete history item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Badges and timestamp */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0057FF]/10 text-[#0057FF] font-medium border border-[#0057FF]/20">
                        <Mic className="w-3 h-3 text-[#0057FF]" />
                        {item.voice}
                      </span>
                      {item.language && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 shadow-xs">
                          <Languages className="w-3 h-3 text-slate-500" />
                          {item.language}
                        </span>
                      )}
                      {item.is_favorite && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-medium">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                          Favorite
                        </span>
                      )}
                      <span className="text-slate-400 flex items-center gap-1 text-[11px] ml-auto">
                        <Clock className="w-3 h-3 text-slate-400" />
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
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-200/80 text-xs">
                      <button
                        onClick={() => handleUseHistoryText(item.text)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm flex items-center gap-1.5 transition cursor-pointer font-medium"
                        title="Load this text into input"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Load Text</span>
                      </button>

                      <button
                        onClick={() => handleCopyHistoryUrl(item)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm flex items-center gap-1.5 transition cursor-pointer font-medium"
                        title="Copy direct audio URL"
                      >
                        {copiedHistoryId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.audio_url}
                        download
                        className="px-2.5 py-1 rounded-lg bg-[#0057FF] hover:bg-[#0047db] text-white font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
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
          <p className="text-slate-400">
            Day 9 Completed: Multi-format Document Upload & Text Extraction (PDF Section 17).
          </p>
        </footer>

      </div>

      {/* Auth Modal (Day 8 Level 2 User Authentication) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#0057FF]/10 border border-[#0057FF]/20 text-[#0057FF]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {authMode === 'login'
                      ? 'Access your personal speech history'
                      : 'Create an account for personal history'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-[#F8F7F4] p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login')
                  setAuthError(null)
                }}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register')
                  setAuthError(null)
                }}
                className={`py-1.5 rounded-lg transition cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder={authMode === 'register' ? 'Choose username (min 3 chars)' : 'Your username'}
                  className="w-full bg-[#F8F7F4]/60 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder={authMode === 'register' ? 'Min 6 characters' : 'Your password'}
                  className="w-full bg-[#F8F7F4]/60 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057FF]"
                />
              </div>

              {authError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0057FF] hover:bg-[#0047db] text-white font-medium text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register')
                      setAuthError(null)
                    }}
                    className="text-[#0057FF] hover:underline font-medium cursor-pointer"
                  >
                    Register here
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login')
                      setAuthError(null)
                    }}
                    className="text-[#0057FF] hover:underline font-medium cursor-pointer"
                  >
                    Sign in here
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
