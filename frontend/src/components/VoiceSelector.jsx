import React, { useState } from 'react'
import {
  Mic,
  Search,
  Star,
  Play,
  Pause,
  Languages,
  Volume2,
} from 'lucide-react'

export default function VoiceSelector({
  languages = [],
  voices = [],
  selectedLanguage,
  selectedVoice,
  onSelectLanguage,
  onSelectVoice,
  favoriteVoices = [],
  onToggleFavoriteVoice,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState('all') // 'all' | 'Female' | 'Male'
  const [playingVoiceId, setPlayingVoiceId] = useState(null)
  const [sampleAudio, setSampleAudio] = useState(null)

  // Filter voices by selected language, gender, and search query
  const filteredVoices = voices.filter((v) => {
    const matchesLang = selectedLanguage ? v.language === selectedLanguage : true
    const matchesGender = genderFilter === 'all' ? true : v.gender === genderFilter
    const matchesSearch = searchQuery
      ? v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.language && v.language.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
    return matchesLang && matchesGender && matchesSearch
  })

  // Play voice preview sample
  const handlePlaySample = async (voiceId) => {
    if (playingVoiceId === voiceId && sampleAudio) {
      sampleAudio.pause()
      setPlayingVoiceId(null)
      return
    }

    if (sampleAudio) {
      sampleAudio.pause()
    }

    try {
      setPlayingVoiceId(voiceId)
      const res = await fetch(`/api/voices/${voiceId}/sample`)
      const data = await res.json()
      if (data.sample_audio_url) {
        const audio = new Audio(data.sample_audio_url)
        setSampleAudio(audio)
        audio.play()
        audio.addEventListener('ended', () => setPlayingVoiceId(null))
        audio.addEventListener('error', () => setPlayingVoiceId(null))
      }
    } catch {
      setPlayingVoiceId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Top filters row: Language selector + Gender tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Language dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-900" />
            Language / Locale
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => onSelectLanguage(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer shadow-2xs"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang} className="bg-white text-slate-800">
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Gender filter tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-blue-900" />
            Voice Gender
          </label>
          <div className="grid grid-cols-3 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold">
            {['all', 'Female', 'Male'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                className={`py-1 rounded-lg transition cursor-pointer capitalize text-center ${
                  genderFilter === g
                    ? 'bg-white text-blue-950 shadow-2xs font-bold border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search voices */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search voices by name or accent..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 transition shadow-2xs"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Voice cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
        {filteredVoices.map((v) => {
          const isSelected = selectedVoice === v.id
          const isFav = favoriteVoices.includes(v.id)
          const isPlaying = playingVoiceId === v.id

          return (
            <div
              key={v.id}
              onClick={() => onSelectVoice(v.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 relative group ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-900 ring-2 ring-blue-900/20 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    v.gender === 'Female'
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'bg-blue-50 text-blue-900 border border-blue-200'
                  }`}
                >
                  {v.gender === 'Female' ? '♀' : '♂'}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">{v.name}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {v.language || 'Neural Voice'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Voice sample preview button */}
                <button
                  type="button"
                  onClick={() => handlePlaySample(v.id)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isPlaying
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-400 hover:text-blue-900 hover:bg-blue-50'
                  }`}
                  title={isPlaying ? 'Pause sample' : 'Listen to voice sample preview'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-slate-400 group-hover:fill-blue-900" />
                  )}
                </button>

                {/* Favorite toggle */}
                <button
                  type="button"
                  onClick={() => onToggleFavoriteVoice(v.id)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isFav
                      ? 'text-amber-500 bg-amber-50 border border-amber-200'
                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={isFav ? 'Favorited voice' : 'Add to favorite voices'}
                >
                  <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            </div>
          )
        })}

        {filteredVoices.length === 0 && (
          <div className="col-span-2 py-6 text-center text-slate-500 text-xs flex flex-col items-center gap-1 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Volume2 className="w-5 h-5 text-slate-400" />
            <span>No voices match your search query.</span>
          </div>
        )}
      </div>
    </div>
  )
}
