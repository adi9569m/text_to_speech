import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Navbar from './components/Navbar'
import LandingView from './components/LandingView'
import StudioView from './components/StudioView'
import LibraryView from './components/LibraryView'
import AnalyticsView from './components/AnalyticsView'
import AuthModal from './components/AuthModal'
import Toast from './components/Toast'

// Initial fallback voices while fetching from API
const INITIAL_VOICES = [
  { id: 'en-US-JennyNeural', name: 'Jenny (Female)', gender: 'Female', language: 'English (US)' },
  { id: 'en-US-GuyNeural', name: 'Guy (Male)', gender: 'Male', language: 'English (US)' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara (Female)', gender: 'Female', language: 'Hindi (India)' },
  { id: 'hi-IN-MadhurNeural', name: 'Madhur (Male)', gender: 'Male', language: 'Hindi (India)' },
  { id: 'gu-IN-DhwaniNeural', name: 'Dhwani (Female)', gender: 'Female', language: 'Gujarati (India)' },
  { id: 'mr-IN-AarohiNeural', name: 'Aarohi (Female)', gender: 'Female', language: 'Marathi (India)' },
  { id: 'es-ES-ElviraNeural', name: 'Elvira (Female)', gender: 'Female', language: 'Spanish (Spain)' },
  { id: 'fr-FR-DeniseNeural', name: 'Denise (Female)', gender: 'Female', language: 'French (France)' },
  { id: 'de-DE-KatjaNeural', name: 'Katja (Female)', gender: 'Female', language: 'German (Germany)' },
]

export default function App() {
  const [activeView, setActiveView] = useState('home') // 'home' | 'studio' | 'library' | 'analytics'
  const [backendStatus, setBackendStatus] = useState('checking')

  const [text, setText] = useState(
    'Convert your written text into high-fidelity, natural-sounding speech across multiple languages.'
  )
  const charLimit = 1000

  // Voice & Tuning states
  const [languages, setLanguages] = useState([
    'English (US)',
    'Hindi (India)',
    'Gujarati (India)',
    'Marathi (India)',
    'Spanish (Spain)',
    'French (France)',
    'German (Germany)',
  ])
  const [voices, setVoices] = useState(INITIAL_VOICES)
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)')
  const [selectedVoice, setSelectedVoice] = useState('en-US-JennyNeural')

  const [speed, setSpeed] = useState('+0%')
  const [pitch, setPitch] = useState('+0Hz')
  const [volume, setVolume] = useState('+0%')

  const [favoriteVoices, setFavoriteVoices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tts_favorite_voices') || '[]')
    } catch {
      return []
    }
  })

  // User Auth State
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
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // Audio Generation State
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState(null)
  const [copiedAudio, setCopiedAudio] = useState(false)

  // Library / History State
  const [historyItems, setHistoryItems] = useState([])
  const [totalHistory, setTotalHistory] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Toasts
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4)
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }, [])

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const getAuthHeaders = useCallback(() => {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {}
  }, [authToken])

  // Backend Health Check
  const checkHealth = useCallback(async () => {
    try {
      const res = await axios.get('/api/health', { timeout: 3000 })
      if (res.data?.status === 'ok') {
        setBackendStatus('online')
      } else {
        setBackendStatus('offline')
      }
    } catch {
      setBackendStatus('offline')
    }
  }, [])

  // Fetch Voice catalog
  const fetchVoices = useCallback(async () => {
    try {
      const res = await axios.get('/api/voices', { timeout: 3500 })
      if (res.data?.voices) setVoices(res.data.voices)
      if (res.data?.languages) setLanguages(res.data.languages)
    } catch {
      // Retain fallback voices
    }
  }, [])

  // Fetch History records
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get('/api/history', {
        headers: getAuthHeaders(),
        timeout: 4000,
      })
      if (res.data) {
        setHistoryItems(res.data.items || [])
        setTotalHistory(res.data.total || 0)
      }
    } catch {
      // Failed silently
    } finally {
      setIsLoadingHistory(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    checkHealth()
    fetchVoices()
    fetchHistory()

    const interval = setInterval(checkHealth, 12000)
    return () => clearInterval(interval)
  }, [checkHealth, fetchVoices, fetchHistory])

  useEffect(() => {
    fetchHistory()
  }, [authToken, fetchHistory])

  // Pause any audio when user switches tabs to prevent unexpected background playback
  useEffect(() => {
    document.querySelectorAll('audio').forEach((el) => {
      try {
        el.pause()
      } catch {
        // Ignore
      }
    })
  }, [activeView])

  // Language Change Handler
  const handleSelectLanguage = (newLang) => {
    setSelectedLanguage(newLang)
    const matching = voices.filter((v) => v.language === newLang)
    if (matching.length > 0) {
      setSelectedVoice(matching[0].id)
    }
  }

  // Favorite voice toggle
  const handleToggleFavoriteVoice = (voiceId) => {
    setFavoriteVoices((prev) => {
      const next = prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId]
      try {
        localStorage.setItem('tts_favorite_voices', JSON.stringify(next))
      } catch {
        // Storage full/disabled
      }
      return next
    })
  }

  // Speech Generation
  const handleGenerate = async () => {
    const input = text.trim()
    if (!input) {
      addToast('error', 'Empty Text', 'Please enter some text to generate speech.')
      return
    }
    if (input.length > charLimit) {
      addToast('error', 'Limit Exceeded', `Text exceeds limit of ${charLimit} characters.`)
      return
    }

    setIsGenerating(true)
    try {
      const res = await axios.post(
        '/api/tts',
        {
          text: input,
          language: selectedLanguage,
          voice: selectedVoice,
          rate: speed,
          pitch: pitch,
          volume: volume,
        },
        { headers: getAuthHeaders() }
      )

      setGeneratedAudio(res.data)
      fetchHistory()
      addToast('success', 'Speech Rendered', `Generated ${res.data.word_count} words with ${res.data.voice}`)
    } catch (err) {
      const status = err.response?.status
      if (status === 429) {
        addToast('error', 'Rate Limit Exceeded', 'Maximum 30 requests per minute. Please wait a moment.')
      } else if (status === 400) {
        addToast('error', 'Invalid Request', err.response?.data?.detail || 'Invalid synthesis parameters.')
      } else if (!err.response) {
        addToast('error', 'Network Error', 'Cannot communicate with the FastAPI backend server.')
        setBackendStatus('offline')
      } else {
        addToast('error', 'Synthesis Failed', err.response?.data?.detail || 'Server error occurred.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy direct audio URL
  const handleCopyAudio = () => {
    if (!generatedAudio) return
    const url = `${window.location.origin}${generatedAudio.audio_url}`
    navigator.clipboard.writeText(url)
    setCopiedAudio(true)
    addToast('success', 'Link Copied', 'Direct audio stream link copied to clipboard.')
    setTimeout(() => setCopiedAudio(false), 2000)
  }

  // History operations
  const handleDeleteHistoryItem = async (id) => {
    try {
      await axios.delete(`/api/history/${id}`, { headers: getAuthHeaders() })
      setHistoryItems((prev) => prev.filter((item) => item.id !== id))
      setTotalHistory((prev) => Math.max(0, prev - 1))
      addToast('info', 'Clip Deleted', 'History record removed.')
    } catch {
      addToast('error', 'Delete Failed', 'Could not delete history record.')
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your entire speech history?')) {
      return
    }
    try {
      await axios.delete('/api/history', { headers: getAuthHeaders() })
      setHistoryItems([])
      setTotalHistory(0)
      addToast('info', 'History Cleared', 'All speech records removed.')
    } catch {
      addToast('error', 'Clear Failed', 'Could not clear speech history.')
    }
  }

  const handleToggleFavoriteItem = async (id) => {
    try {
      setHistoryItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
        )
      )
      await axios.patch(`/api/history/${id}/favorite`, {}, { headers: getAuthHeaders() })
    } catch {
      fetchHistory()
    }
  }

  const handleLoadTextIntoStudio = (itemText) => {
    setText(itemText)
    setActiveView('studio')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    addToast('info', 'Script Loaded', 'Loaded text from library into studio editor.')
  }

  const handlePlayInStudioPlayer = (item) => {
    setGeneratedAudio({
      audio_url: item.audio_url,
      filename: item.audio_url.split('/').pop() || 'audio.mp3',
      voice: item.voice,
      char_count: item.text.length,
      word_count: item.text.trim().split(/\s+/).length,
      audio_format: 'mp3',
    })
    setActiveView('studio')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSignOut = () => {
    setCurrentUser(null)
    setAuthToken(null)
    localStorage.removeItem('tts_auth_user')
    localStorage.removeItem('tts_auth_token')
    addToast('info', 'Signed Out', 'You have been logged out.')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Studio Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        backendStatus={backendStatus}
        onRefreshHealth={() => {
          setBackendStatus('checking')
          checkHealth()
          fetchVoices()
          fetchHistory()
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        historyCount={totalHistory}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={activeView === 'home' ? 'block' : 'hidden'}>
          <LandingView onLaunchStudio={() => setActiveView('studio')} />
        </div>

        <div className={activeView === 'studio' ? 'block' : 'hidden'}>
          <StudioView
            text={text}
            setText={setText}
            charLimit={charLimit}
            languages={languages}
            voices={voices}
            selectedLanguage={selectedLanguage}
            selectedVoice={selectedVoice}
            onSelectLanguage={handleSelectLanguage}
            onSelectVoice={setSelectedVoice}
            speed={speed}
            setSpeed={setSpeed}
            pitch={pitch}
            setPitch={setPitch}
            volume={volume}
            setVolume={setVolume}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            generatedAudio={generatedAudio}
            onCopyAudio={handleCopyAudio}
            copiedAudio={copiedAudio}
            favoriteVoices={favoriteVoices}
            onToggleFavoriteVoice={handleToggleFavoriteVoice}
            isFavoriteAudio={false}
            onToggleFavoriteAudio={() => {}}
            onAddToast={addToast}
          />
        </div>

        <div className={activeView === 'library' ? 'block' : 'hidden'}>
          <LibraryView
            historyItems={historyItems}
            totalHistory={totalHistory}
            isLoading={isLoadingHistory}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onToggleFavoriteItem={handleToggleFavoriteItem}
            onLoadTextIntoStudio={handleLoadTextIntoStudio}
            onPlayInStudioPlayer={handlePlayInStudioPlayer}
            onAddToast={addToast}
          />
        </div>

        <div className={activeView === 'analytics' ? 'block' : 'hidden'}>
          <AnalyticsView
            currentUser={currentUser}
            authToken={authToken}
            isActive={activeView === 'analytics'}
            onOpenAuthModal={() => setIsAuthOpen(true)}
            onNavigateToStudio={() => setActiveView('studio')}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 space-y-1.5 bg-white">
        <p className="font-bold text-slate-900">
          VoiceFlow Studio
        </p>
        <p className="text-slate-500">
          High-Fidelity Neural Text-to-Speech Platform • Powered by FastAPI & React
        </p>
      </footer>

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user, token, message) => {
          setCurrentUser(user)
          setAuthToken(token)
          addToast('success', 'Authenticated', message)
        }}
      />

      {/* Floating Toast Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
