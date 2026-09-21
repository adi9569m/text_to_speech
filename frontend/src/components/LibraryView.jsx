import React, { useState, useRef } from 'react'
import {
  History,
  Star,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Download,
  Search,
  Clock,
  Mic,
  Languages,
  FileAudio,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react'

const VOICE_NAMES = {
  'en-US-JennyNeural': 'Jenny (US)',
  'en-US-GuyNeural': 'Guy (US)',
  'en-US-AriaNeural': 'Aria (US)',
  'hi-IN-SwaraNeural': 'Swara (Hindi)',
  'hi-IN-MadhurNeural': 'Madhur (Hindi)',
  'gu-IN-DhwaniNeural': 'Dhwani (Gujarati)',
  'gu-IN-NiranjanNeural': 'Niranjan (Gujarati)',
  'mr-IN-AarohiNeural': 'Aarohi (Marathi)',
  'mr-IN-ManoharNeural': 'Manohar (Marathi)',
  'es-ES-ElviraNeural': 'Elvira (Spanish)',
  'es-ES-AlvaroNeural': 'Alvaro (Spanish)',
  'fr-FR-DeniseNeural': 'Denise (French)',
  'fr-FR-HenriNeural': 'Henri (French)',
  'de-DE-KatjaNeural': 'Katja (German)',
  'de-DE-ConradNeural': 'Conrad (German)',
}

function formatVoiceName(voiceId) {
  if (!voiceId) return 'Neural Voice'
  if (VOICE_NAMES[voiceId]) return VOICE_NAMES[voiceId]
  return voiceId.replace(/^[a-z]{2,3}-[A-Z]{2,3}-/, '').replace(/Neural$/, '')
}

function formatLanguageName(lang) {
  if (!lang) return ''
  const langMap = {
    'en-US': 'English (US)',
    'hi-IN': 'Hindi (India)',
    'gu-IN': 'Gujarati (India)',
    'mr-IN': 'Marathi (India)',
    'es-ES': 'Spanish (Spain)',
    'fr-FR': 'French (France)',
    'de-DE': 'German (Germany)',
  }
  return langMap[lang] || lang
}

function InlineAudioPlayer({ src }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      document.querySelectorAll('audio').forEach((el) => {
        if (el !== audioRef.current) el.pause()
      })
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const handleSeek = (e) => {
    const nextTime = parseFloat(e.target.value)
    setCurrentTime(nextTime)
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00'
    const mins = Math.floor(secs / 60)
    const rem = Math.floor(secs % 60)
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="w-full bg-slate-50/90 border border-slate-200/90 rounded-xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xs">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Play / Pause */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0 ${
          isPlaying
            ? 'bg-blue-900 text-white shadow-xs'
            : 'bg-white border border-slate-200 text-slate-700 hover:text-blue-900 hover:border-blue-200 shadow-2xs'
        }`}
        title={isPlaying ? 'Pause' : 'Play audio'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        )}
      </button>

      {/* Elapsed Time */}
      <span className="text-xs font-mono font-medium text-slate-600 w-10 text-right shrink-0">
        {formatTime(currentTime)}
      </span>

      {/* Scrubber Progress Track */}
      <div className="flex-1 relative flex items-center">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
          style={{
            background: `linear-gradient(to right, #1E3A8A ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
          }}
          title="Seek playback"
        />
      </div>

      {/* Total Duration */}
      <span className="text-xs font-mono font-medium text-slate-400 w-10 shrink-0">
        {formatTime(duration)}
      </span>

      {/* Mute Toggle */}
      <button
        type="button"
        onClick={toggleMute}
        className="p-1.5 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="w-3.5 h-3.5 text-rose-500" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}

export default function LibraryView({
  historyItems = [],
  totalHistory = 0,
  isLoading = false,
  currentUser,
  onOpenAuth,
  onDeleteHistoryItem,
  onClearHistory,
  onToggleFavoriteItem,
  onLoadTextIntoStudio,
  onPlayInStudioPlayer,
  onAddToast,
}) {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'favorites'
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const filteredItems = historyItems
    .filter((item) => (activeTab === 'favorites' ? item.is_favorite : true))
    .filter((item) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        item.text.toLowerCase().includes(q) ||
        item.voice.toLowerCase().includes(q) ||
        (item.language && item.language.toLowerCase().includes(q))
      )
    })

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

  const handleCopyLink = (item) => {
    const url = `${window.location.origin}${item.audio_url}`
    navigator.clipboard.writeText(url)
    setCopiedId(item.id)
    onAddToast('success', 'Link Copied', 'Direct audio URL copied to clipboard.')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center shrink-0 shadow-2xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Audio Library & History</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-950 border border-blue-200 font-bold">
                  {totalHistory}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentUser ? (
                  <>
                    Personal library for <strong className="text-slate-800">{currentUser.name || currentUser.username}</strong>
                  </>
                ) : (
                  <>
                    Guest speech history •{' '}
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="text-blue-900 hover:underline font-bold cursor-pointer"
                    >
                      Sign in
                    </button>{' '}
                    to save across devices
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Tab buttons and Clear All */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-950 shadow-2xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({historyItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('favorites')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-amber-50 text-amber-800 shadow-2xs font-bold border border-amber-200'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Favorites ({historyItems.filter((i) => i.is_favorite).length})
              </button>
            </div>

            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/70 border border-rose-200 transition cursor-pointer font-bold"
                title="Clear all history records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search library clips by script text, voice name, or language..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 bg-white shadow-2xs ${
              item.is_favorite
                ? 'border-amber-300 bg-amber-50/15'
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
          >
            {/* Top row: Text & Actions */}
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-slate-800 leading-relaxed font-medium">
                &ldquo;{item.text}&rdquo;
              </p>

              <div className="flex items-center gap-1 shrink-0">
                {/* Favorite toggle */}
                <button
                  type="button"
                  onClick={() => onToggleFavoriteItem(item.id)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    item.is_favorite
                      ? 'text-amber-600 bg-amber-50 border border-amber-200'
                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={item.is_favorite ? 'Favorited clip' : 'Mark as favorite'}
                >
                  <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteHistoryItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-900 font-semibold border border-blue-200">
                <Mic className="w-3 h-3 text-blue-900" />
                {formatVoiceName(item.voice)}
              </span>
              {item.language && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  <Languages className="w-3 h-3 text-slate-500" />
                  {formatLanguageName(item.language)}
                </span>
              )}
              {item.is_favorite && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[11px]">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  Favorite
                </span>
              )}

              <span className="text-slate-400 flex items-center gap-1 text-[11px] ml-auto font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDate(item.created_at)}
              </span>
            </div>

            {/* Custom Light-Themed Audio Player */}
            <InlineAudioPlayer src={item.audio_url} />

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onPlayInStudioPlayer(item)}
                className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1.5 transition cursor-pointer shadow-2xs font-bold"
                title="Open in Studio audio workstation player"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Open in Studio Player</span>
              </button>

              <button
                type="button"
                onClick={() => onLoadTextIntoStudio(item.text)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Load this text back into the studio editor"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-900" />
                <span>Load Script</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink(item)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Copy direct link to audio file"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={item.audio_url}
                download
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}

        {isLoading && historyItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
            <span>Loading speech history...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-3 bg-white border border-dashed border-slate-200 rounded-2xl">
            <FileAudio className="w-10 h-10 text-slate-400" />
            <span className="text-slate-800 font-bold">
              {activeTab === 'favorites' ? 'No favorite audio clips yet' : 'No audio clips found'}
            </span>
            <p className="text-xs text-slate-500 max-w-sm">
              {activeTab === 'favorites'
                ? 'Star any speech generation to keep it pinned in your favorites library.'
                : 'Convert your first script in the Studio tab to see it stored here automatically.'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
