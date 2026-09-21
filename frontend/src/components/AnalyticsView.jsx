import React, { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  Music,
  FileText,
  Volume2,
  RefreshCw,
  Server,
  Layers,
  CheckCircle2,
  Bookmark,
  Sparkles,
  ArrowRight,
  User,
  Globe,
} from 'lucide-react'

export default function AnalyticsView({
  currentUser,
  authToken,
  isActive,
  onOpenAuthModal,
  onNavigateToStudio,
}) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [scope, setScope] = useState('user')

  const fetchAnalytics = useCallback(
    async (targetScope = scope) => {
      setIsLoading(true)
      try {
        const token = authToken || localStorage.getItem('tts_auth_token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`/api/analytics?scope=${targetScope}`, { headers })
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false)
      }
    },
    [authToken, scope]
  )

  useEffect(() => {
    if (isActive !== false) {
      fetchAnalytics(scope)
    }
  }, [isActive, authToken, scope, fetchAnalytics])

  const isPersonal = data?.is_personal ?? (scope === 'user' && !!currentUser)
  const totalGen = data?.total_generations || 0
  const totalChars = data?.total_characters_synthesized || 0
  const totalWords = data?.total_words_synthesized || 0
  const totalFavs = data?.total_favorites || 0
  const topVoices = data?.top_voices || []
  const topLanguages = data?.top_languages || []

  return (
    <div className="space-y-6">
      {/* Guest Informational Banner */}
      {!currentUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-950">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-900 shrink-0" />
            <span>
              <strong>Personalize your analytics:</strong> Create a free account or sign in to save your speech history and track your dedicated voice analytics.
            </span>
          </div>
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg shadow-2xs transition cursor-pointer shrink-0"
            >
              Sign In / Register
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center shrink-0 shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {scope === 'user'
                  ? currentUser
                    ? `${currentUser.name || currentUser.username}'s Analytics`
                    : 'Session Analytics'
                  : 'Platform Studio Analytics'}
              </h2>
              {isPersonal && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-900">
                  Personal Dashboard
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {scope === 'user'
                ? currentUser
                  ? `Activity and speech metrics private to @${currentUser.username}.`
                  : 'Activity generated during your current session.'
                : 'System-wide generation volume, top voices, and usage metrics.'}
            </p>
          </div>
        </div>

        {/* Scope Switcher and Refresh */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScope('user')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                scope === 'user'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentUser ? 'My Analytics' : 'Session'}</span>
            </button>

            <button
              type="button"
              onClick={() => setScope('global')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                scope === 'global'
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(scope)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Audio Clips</span>
            <Music className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalGen}</div>
          <p className="text-[11px] text-slate-400 font-medium">
            {scope === 'user' ? 'Clips generated by you' : 'Total audio files across platform'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Characters</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalChars.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 font-medium">
            {scope === 'user' ? 'Processed in your generations' : 'Total platform text throughput'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Words Synthesized</span>
            <Volume2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalWords.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 font-medium">
            {scope === 'user' ? 'Spoken words in your scripts' : 'Total spoken words synthesized'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Bookmarked Favorites</span>
            <Bookmark className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalFavs}</div>
          <p className="text-[11px] text-slate-400 font-medium">
            Saved audio clips in library
          </p>
        </div>
      </div>

      {/* Empty State when zero generations recorded */}
      {totalGen === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 mx-auto flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {scope === 'user' ? 'No personal speech activity yet' : 'No platform activity recorded yet'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {scope === 'user'
                ? 'Once you synthesize your first text or document in the studio, your personal analytics, top voices, and language distribution will appear here.'
                : 'Generate audio clips in the studio to see platform-wide usage metrics.'}
            </p>
          </div>
          {onNavigateToStudio && (
            <button
              type="button"
              onClick={onNavigateToStudio}
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
            >
              <span>Open Studio to Generate Speech</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* 2-Column Details: Top Voices & Top Languages */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Voices */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-900" />
              {scope === 'user' ? 'Your Top Voices' : 'Top Synthesized Voices'}
            </h3>

            <div className="space-y-3">
              {topVoices.map((v) => {
                const pct = totalGen > 0 ? Math.round((v.count / totalGen) * 100) : 0
                return (
                  <div key={v.voice} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{v.voice}</span>
                      <span className="text-slate-500 font-mono font-medium">
                        {v.count} clips ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-900 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {topVoices.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">No voice data recorded yet.</div>
              )}
            </div>
          </div>

          {/* Top Languages */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              {scope === 'user' ? 'Your Language Distribution' : 'Language Distribution'}
            </h3>

            <div className="space-y-3">
              {topLanguages.map((l) => {
                const pct = totalGen > 0 ? Math.round((l.count / totalGen) * 100) : 0
                return (
                  <div key={l.language} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{l.language}</span>
                      <span className="text-slate-500 font-mono font-medium">
                        {l.count} clips ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}

              {topLanguages.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">No language data recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Infrastructure Architecture Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-900" />
          TTS Platform Architecture Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600 pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-900" />
              Speech Engine
            </div>
            <p>Microsoft Edge-TTS Neural voices with 24kHz sampling rate</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Document Processing
            </div>
            <p>Multi-format text extraction supporting .txt, .pdf, and .docx</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-600" />
              User Isolation & DB
            </div>
            <p>Per-user isolated history, PBKDF2 cryptography, SQLite database</p>
          </div>
        </div>
      </div>
    </div>
  )
}
