import React, { useState } from 'react'
import { ArrowRight, Play, Pause, Volume2, Check } from 'lucide-react'

// 3 quick preview voices
const PREVIEW_VOICES = [
  { id: 'en-US-JennyNeural', name: 'Jenny', lang: 'English (US)' },
  { id: 'en-US-GuyNeural', name: 'Guy', lang: 'English (US)' },
  { id: 'hi-IN-SwaraNeural', name: 'Swara', lang: 'Hindi (India)' },
]

export default function LandingView({ onLaunchStudio }) {
  const [playingVoiceId, setPlayingVoiceId] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)

  const handlePlayPreview = async (voiceId) => {
    if (playingVoiceId === voiceId && currentAudio) {
      currentAudio.pause()
      setPlayingVoiceId(null)
      return
    }

    if (currentAudio) {
      currentAudio.pause()
    }

    try {
      setPlayingVoiceId(voiceId)
      const res = await fetch(`/api/voices/${voiceId}/sample`)
      const data = await res.json()
      if (data.sample_audio_url) {
        const audio = new Audio(data.sample_audio_url)
        setCurrentAudio(audio)
        audio.play()
        audio.addEventListener('ended', () => setPlayingVoiceId(null))
        audio.addEventListener('error', () => setPlayingVoiceId(null))
      }
    } catch {
      setPlayingVoiceId(null)
    }
  }

  return (
    <div className="min-h-[72vh] flex flex-col items-center justify-center text-center px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-900" />
          <span>Simple • Natural • Free</span>
        </div>

        {/* Clean Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Natural speech synthesis,{' '}
          <span className="text-blue-900">made simple.</span>
        </h1>

        {/* Concise Description */}
        <p className="text-base sm:text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">
          Convert your text or documents into fluid, realistic spoken audio in seconds. Choose a voice, listen, and export.
        </p>

        {/* Primary CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLaunchStudio}
            className="px-7 py-3.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-base transition shadow-sm hover:shadow-md cursor-pointer inline-flex items-center gap-2 active:scale-[0.99]"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Voice Preview Bar */}
        <div className="pt-6 border-t border-slate-200/80 max-w-md mx-auto space-y-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Hear sample voices
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PREVIEW_VOICES.map((v) => {
              const isPlaying = playingVoiceId === v.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handlePlayPreview(v.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    isPlaying
                      ? 'bg-blue-900 text-white border-blue-900 shadow-2xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>{v.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({v.lang.split(' ')[0]})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3 Simple Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Natural Neural Voices
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            PDF & Docx Import
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            No Account Required
          </span>
        </div>
      </div>
    </div>
  )
}
