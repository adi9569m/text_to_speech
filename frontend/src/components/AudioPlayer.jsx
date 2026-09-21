import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  RotateCcw,
  RotateCw,
  Download,
  Copy,
  Check,
  Music,
  Gauge,
  Star,
  FileAudio,
} from 'lucide-react'

export default function AudioPlayer({
  src,
  filename,
  metadata = {},
  onCopy,
  copied = false,
  autoPlay = false,
  isFavorite = false,
  onToggleFavorite,
}) {
  const audioRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1.0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [downloadFormat, setDownloadFormat] = useState('mp3')

  const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0]

  useEffect(() => {
    if (!audioRef.current || !src) return

    setIsPlaying(false)
    setCurrentTime(0)

    const audio = audioRef.current
    audio.src = src
    audio.load()

    if (autoPlay) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false))
      }
    }
  }, [src, autoPlay])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

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

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }

  const handleSeek = (e) => {
    const nextTime = parseFloat(e.target.value)
    setCurrentTime(nextTime)
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime
    }
  }

  const handleSkip = (seconds) => {
    if (!audioRef.current) return
    const next = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration)
    audioRef.current.currentTime = next
    setCurrentTime(next)
  }

  const handleVolumeChange = (e) => {
    const nextVol = parseFloat(e.target.value)
    setVolume(nextVol)
    if (isMuted && nextVol > 0) setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00'
    const mins = Math.floor(secs / 60)
    const remainingSecs = Math.floor(secs % 60)
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
  }

  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 text-slate-800">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Header Info & Animated Equalizer */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center shrink-0 shadow-2xs">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                {metadata.voice || 'Neural Speech Output'}
              </h4>
              {metadata.language && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {metadata.language}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {metadata.charCount ? `${metadata.charCount} characters` : 'Ready to play'}
              {metadata.wordCount ? ` • ${metadata.wordCount} words` : ''}
              {metadata.fileSize ? ` • ${formatBytes(metadata.fileSize)}` : ''}
            </p>
          </div>
        </div>

        {/* Dynamic Equalizer Visualizer */}
        <div className="flex items-end gap-1 h-6 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
          {[0.6, 0.9, 0.4, 1.0, 0.7, 0.5, 0.8].map((factor, idx) => (
            <span
              key={idx}
              className={`w-1 bg-gradient-to-t from-blue-950 to-blue-700 rounded-full transition-all duration-200 ${
                isPlaying ? 'animate-pulse' : 'opacity-30'
              }`}
              style={{
                height: isPlaying ? `${Math.max(4, factor * 20)}px` : '4px',
                animationDelay: `${idx * 100}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Scrub Timeline */}
      <div className="space-y-1.5">
        <div className="relative flex items-center group">
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
            style={{
              background: `linear-gradient(to right, #1E3A8A ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
            }}
            title="Seek playback position"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Workstation Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play / Skip Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-blue-900 hover:bg-blue-950 hover:scale-105 shadow-blue-900/30 ring-4 ring-blue-900/20'
                : 'bg-blue-900 hover:bg-blue-950 shadow-blue-900/25 hover:scale-105'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSkip(5)}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Fast forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume & Mute */}
        <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={toggleMute}
            className="text-slate-500 hover:text-indigo-600 transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-600" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 sm:w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 focus:outline-none"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />

          <span className="text-[10px] font-mono text-slate-500 w-7 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* Speed Chips */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-blue-900" />
            Speed
          </span>
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                playbackRate === rate
                  ? 'bg-blue-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-500 font-mono text-[11px] truncate max-w-xs flex items-center gap-1.5">
          <FileAudio className="w-3.5 h-3.5 text-blue-900 shrink-0" />
          {filename || 'audio.mp3'}
        </span>

        <div className="flex items-center gap-2">
          {/* Favorite Toggle Button */}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer font-semibold ${
                isFavorite
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
              <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>
          )}

          {/* Copy Direct Link Button */}
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-2xs font-semibold"
              title="Copy audio stream URL"
            >
              {copied ? (
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
          )}

          {/* Format selector (MP3 / WAV) */}
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
          </select>

          {/* Download Button */}
          <a
            href={src}
            download={
              filename
                ? filename.replace(/\.mp3$/, `.${downloadFormat}`)
                : `audio.${downloadFormat}`
            }
            className="px-3.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>
    </div>
  )
}
