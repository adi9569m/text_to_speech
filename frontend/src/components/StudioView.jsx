import React, { useState, useRef } from 'react'
import {
  FileText,
  SlidersHorizontal,
  Upload,
  RefreshCw,
  Clock,
  Sparkles,
  Volume2,
  Volume1,
  RotateCcw,
  Gauge,
  CheckCircle2,
  X,
  Trash2,
  Wand2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import VoiceSelector from './VoiceSelector'
import AudioPlayer from './AudioPlayer'

// Sample presets for quick testing
const PRESETS = [
  {
    label: '✨ Natural Speech',
    text: 'Welcome to VoiceFlow. Experience smooth, ultra-realistic neural speech synthesis engineered for clear and expressive audio.',
  },
  {
    label: '📖 Narration',
    text: 'Deep inside the ancient forest, a quiet breeze stirred the autumn leaves. The journey had only just begun.',
  },
  {
    label: '🚀 Tech Demo',
    text: 'VoiceFlow transforms written content into fluid, natural audio with realistic inflection and clarity.',
  },
  {
    label: '💡 Motivation',
    text: 'Every challenge is an opportunity to learn and grow. Stay focused, stay curious, and make today count.',
  },
]

export default function StudioView({
  text,
  setText,
  charLimit = 1000,
  languages,
  voices,
  selectedLanguage,
  selectedVoice,
  onSelectLanguage,
  onSelectVoice,
  speed,
  setSpeed,
  pitch,
  setPitch,
  volume,
  setVolume,
  isGenerating,
  onGenerate,
  generatedAudio,
  onCopyAudio,
  copiedAudio,
  favoriteVoices,
  onToggleFavoriteVoice,
  isFavoriteAudio,
  onToggleFavoriteAudio,
  onAddToast,
}) {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isExtractingDoc, setIsExtractingDoc] = useState(false)
  const [docUploadNotice, setDocUploadNotice] = useState(null)
  const [isEnhancingAI, setIsEnhancingAI] = useState(false)

  // Progressive disclosure states to prevent UI overwhelm
  const [showDocImport, setShowDocImport] = useState(false)
  const [showTextAssistant, setShowTextAssistant] = useState(false)
  const [showTuning, setShowTuning] = useState(false)

  const charCount = text.length
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  // Calculate estimated speaking time at normal speed (~140 words per minute)
  const speedMultiplier = (() => {
    if (speed.startsWith('+')) {
      const pct = parseInt(speed.replace('+', '').replace('%', ''), 10) || 0
      return 1 + pct / 100
    } else if (speed.startsWith('-')) {
      const pct = parseInt(speed.replace('-', '').replace('%', ''), 10) || 0
      return Math.max(0.5, 1 - pct / 100)
    }
    return 1.0
  })()
  const estimatedSeconds = Math.round((wordCount / (140 * speedMultiplier)) * 60)
  const isDefaultTuning = speed === '+0%' && pitch === '+0Hz' && volume === '+0%'

  // Document upload handler (.txt, .pdf, .docx)
  const handleFileUpload = async (file) => {
    if (!file) return

    const validExtensions = ['.txt', '.text', '.pdf', '.docx']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      onAddToast('error', 'Unsupported File', 'Please upload a .txt, .pdf, or .docx document.')
      return
    }

    setIsExtractingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('tts_auth_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await fetch('/api/extract-text', {
        method: 'POST',
        headers,
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to extract text from document.')
      }

      setText(data.text)
      const notice = `Imported "${data.filename}" (${data.char_count} chars${
        data.truncated ? ', truncated to 1000' : ''
      })`
      setDocUploadNotice(notice)
      onAddToast('success', 'Document Imported', `Extracted text from ${data.filename}`)
      setShowDocImport(false)
    } catch (err) {
      onAddToast('error', 'Document Extraction Error', err.message)
    } finally {
      setIsExtractingDoc(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  // Text Assistant handler
  const handleAIEnhance = async (mode) => {
    if (!text.trim()) {
      onAddToast('info', 'No Text', 'Please enter some text first.')
      return
    }

    setIsEnhancingAI(true)
    try {
      const token = localStorage.getItem('tts_auth_token')
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, mode }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Enhancement failed.')
      }

      setText(data.enhanced_text)
      onAddToast(
        'success',
        `${mode.charAt(0).toUpperCase() + mode.slice(1)} Applied`,
        data.changes_applied?.length > 0 ? data.changes_applied[0] : 'Text optimized for speech.'
      )
    } catch (err) {
      onAddToast('error', 'Text Assistant Error', err.message)
    } finally {
      setIsEnhancingAI(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 2-Column Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 relative">
            {/* Header with Title, Presets, and Clear */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-900" />
                Script Editor
              </span>

              <div className="flex items-center gap-2">
                {/* Clear Button */}
                {text.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setText('')
                      setDocUploadNotice(null)
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer flex items-center gap-1"
                    title="Clear text"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Sample:</span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setText(preset.text)
                    setDocUploadNotice(null)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 transition text-[11px] shrink-0 cursor-pointer font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Document upload notice if active */}
            {docUploadNotice && (
              <div className="p-2.5 px-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs flex items-center justify-between gap-2 shadow-2xs">
                <span className="flex items-center gap-1.5 font-medium truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                  {docUploadNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setDocUploadNotice(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Textarea */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-xl transition ${
                isDragging ? 'ring-2 ring-blue-900 bg-blue-50/20' : ''
              }`}
            >
              <textarea
                rows={7}
                value={text}
                maxLength={charLimit}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter or paste text here to convert into natural speech, or choose a sample above..."
                className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white focus:border-transparent transition resize-y leading-relaxed font-sans"
              />

              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-white/95 border-2 border-dashed border-blue-900 rounded-xl flex flex-col items-center justify-center gap-2 pointer-events-none text-blue-950 text-sm">
                  <Upload className="w-8 h-8 animate-bounce text-blue-900" />
                  <span className="font-semibold">Drop document (.txt, .pdf, .docx) here</span>
                </div>
              )}
            </div>

            {/* Progressive Disclosure Action Bar (Document Import & Text Assistant options) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* Option 1: Import Document Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDocImport(!showDocImport)}
                  className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer font-semibold ${
                    showDocImport
                      ? 'bg-blue-50 border-blue-200 text-blue-950'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-blue-900" />
                  <span>Import Document</span>
                </button>

                {/* Option 2: Text Assistant Toggle */}
                <button
                  type="button"
                  onClick={() => setShowTextAssistant(!showTextAssistant)}
                  className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer font-semibold ${
                    showTextAssistant
                      ? 'bg-blue-50 border-blue-200 text-blue-950'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-blue-900" />
                  <span>Text Assistant</span>
                </button>
              </div>

              {/* Character & Speaking Time Counter */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-900" />
                  <strong>~{estimatedSeconds}s</strong>
                </span>
                <span>•</span>
                <span>
                  <strong className={charCount > charLimit * 0.9 ? 'text-amber-600' : 'text-slate-800'}>
                    {charCount}
                  </strong>{' '}
                  / {charLimit}
                </span>
              </div>
            </div>

            {/* Collapsible Document Import Panel */}
            {showDocImport && (
              <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-blue-900" />
                    Upload .txt, .pdf, or .docx
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDocImport(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,.text,.pdf,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isExtractingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExtractingDoc ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Extracting text...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose File</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-slate-500">
                    Or drop your document directly into the editor above.
                  </span>
                </div>
              </div>
            )}

            {/* Collapsible Text Assistant Panel */}
            {showTextAssistant && (
              <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-blue-900" />
                      Text Assistant Options
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Optimize your script for smooth voice narration.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTextAssistant(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={isEnhancingAI || !text.trim()}
                    onClick={() => handleAIEnhance('grammar')}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 border border-slate-200 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-blue-900" />
                    <span>Fix Grammar</span>
                  </button>

                  <button
                    type="button"
                    disabled={isEnhancingAI || !text.trim()}
                    onClick={() => handleAIEnhance('conversational')}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 border border-slate-200 shadow-2xs"
                  >
                    <Volume2 className="w-3 h-3 text-emerald-700" />
                    <span>Conversational</span>
                  </button>

                  <button
                    type="button"
                    disabled={isEnhancingAI || !text.trim()}
                    onClick={() => handleAIEnhance('summarize')}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 border border-slate-200 shadow-2xs"
                  >
                    <FileText className="w-3 h-3 text-amber-700" />
                    <span>Summarize</span>
                  </button>

                  <button
                    type="button"
                    disabled={isEnhancingAI || !text.trim()}
                    onClick={() => handleAIEnhance('formal')}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 border border-slate-200 shadow-2xs"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-slate-700" />
                    <span>Formal Polish</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Voice & Audio Workstation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" />
              Voice Selection
            </span>

            {/* Voice Selector Component */}
            <VoiceSelector
              languages={languages}
              voices={voices}
              selectedLanguage={selectedLanguage}
              selectedVoice={selectedVoice}
              onSelectLanguage={onSelectLanguage}
              onSelectVoice={onSelectVoice}
              favoriteVoices={favoriteVoices}
              onToggleFavoriteVoice={onToggleFavoriteVoice}
            />

            {/* Collapsible Audio Tuning Section (Progressive Disclosure) */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTuning(!showTuning)}
                className="w-full flex items-center justify-between text-xs py-2 px-1 text-slate-700 hover:text-blue-950 font-semibold cursor-pointer transition"
              >
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-900" />
                  <span>Fine-Tune Voice Controls</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-normal ${
                    isDefaultTuning
                      ? 'bg-slate-100 border-slate-200 text-slate-500'
                      : 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                  }`}>
                    {isDefaultTuning ? 'Normal (Default)' : 'Customized'}
                  </span>
                </div>
                {showTuning ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showTuning && (
                <div className="pt-3 pb-1 space-y-3.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200 mt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Adjustments</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSpeed('+0%')
                        setPitch('+0Hz')
                        setVolume('+0%')
                      }}
                      className="text-[11px] text-slate-500 hover:text-blue-900 flex items-center gap-1 transition cursor-pointer font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Defaults
                    </button>
                  </div>

                  {/* Speed Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Speaking Speed</span>
                      <span className="font-mono text-blue-900 font-bold">{speed}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="25"
                      value={parseInt(speed.replace('%', '') || '0', 10)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        setSpeed(val >= 0 ? `+${val}%` : `${val}%`)
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>-50% (Slow)</span>
                      <span>Normal</span>
                      <span>+50% (Fast)</span>
                    </div>
                  </div>

                  {/* Pitch Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Voice Pitch</span>
                      <span className="font-mono text-blue-900 font-bold">{pitch}</span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="10"
                      value={parseInt(pitch.replace('Hz', '') || '0', 10)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        setPitch(val >= 0 ? `+${val}Hz` : `${val}Hz`)
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>-20Hz (Deep)</span>
                      <span>Normal</span>
                      <span>+20Hz (High)</span>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Output Volume</span>
                      <span className="font-mono text-blue-900 font-bold">{volume}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="25"
                      value={parseInt(volume.replace('%', '') || '0', 10)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10)
                        setVolume(val >= 0 ? `+${val}%` : `${val}%`)
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>-50% (Soft)</span>
                      <span>Normal</span>
                      <span>+50% (Loud)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Generate Action Button */}
            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || text.trim() === ''}
              className={`w-full py-4 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition cursor-pointer shadow-md active:scale-[0.99] ${
                isGenerating || text.trim() === ''
                  ? 'bg-slate-300 text-white cursor-not-allowed shadow-none'
                  : 'bg-blue-900 hover:bg-blue-950 text-white shadow-blue-900/20'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Audio...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span>Generate Speech</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Workstation Audio Player when Audio Ready */}
      {generatedAudio && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-semibold">
            <span className="uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-blue-900" />
              Generated Audio
            </span>
            <span className="text-emerald-700 font-bold">✓ Ready for Playback & Download</span>
          </div>

          <AudioPlayer
            src={generatedAudio.audio_url}
            filename={generatedAudio.filename}
            metadata={{
              voice: generatedAudio.voice,
              language: selectedLanguage,
              charCount: generatedAudio.char_count,
              wordCount: generatedAudio.word_count,
              fileSize: generatedAudio.file_size_bytes,
              audioFormat: generatedAudio.audio_format || 'mp3',
            }}
            onCopy={onCopyAudio}
            copied={copiedAudio}
            autoPlay={false}
            isFavorite={isFavoriteAudio}
            onToggleFavorite={onToggleFavoriteAudio}
          />
        </div>
      )}
    </div>
  )
}
