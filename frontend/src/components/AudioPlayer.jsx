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
  Sparkles,
} from 'lucide-react'

/**
 * Custom Interactive Audio Player Component (Day 11 & Day 12 Features)
 * Fulfills Section 4.5 of Python -Text-to-Speech Application.pdf:
 * Play, Pause, Seek (timeline scrubbing), and Volume adjustment.
 */
export default function AudioPlayer({
  src,
  filename,
  metadata = {},
  onCopy,
  copied = false,
  autoPlay = true,
}) {
  const audioRef = useRef(null)

  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1.0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [isLoading, setIsLoading] = useState(false)

  const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0]

  // Initialize and load audio source
  useEffect(() => {
    if (!audioRef.current || !src) return

    setIsPlaying(false)
    setCurrentTime(0)
    setIsLoading(true)

    const audio = audioRef.current
    audio.src = src
    audio.load()

    if (autoPlay) {
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay blocked by browser policy; user can click play
            setIsPlaying(false)
          })
      }
    }
  }, [src, autoPlay])

  // Synchronize playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Synchronize volume and mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Audio lifecycle event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0)
      setIsLoading(false)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  // Play / Pause toggle
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

  // Seek timeline scrubber handler
  const handleSeek = (e) => {
    const nextTime = parseFloat(e.target.value)
    setCurrentTime(nextTime)
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime
    }
  }

  // Jump forwards or backwards by N seconds
  const handleSkip = (seconds) => {
    if (!audioRef.current) return
    const next = Math.min(Math.max(0, audioRef.current.currentTime + seconds), duration)
    audioRef.current.currentTime = next
    setCurrentTime(next)
  }

  // Volume slider handler
  const handleVolumeChange = (e) => {
    const nextVol = parseFloat(e.target.value)
    setVolume(nextVol)
    if (isMuted && nextVol > 0) setIsMuted(false)
  }

  // Toggle Mute
  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00'
    const mins = Math.floor(secs / 60)
    const remainingSecs = Math.floor(secs % 60)
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`
  }

  // Format file size in bytes to KB/MB
  const formatBytes = (bytes) => {
    if (!bytes || isNaN(bytes)) return null
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        preload="metadata"
      />

      {/* Top Header: Playing status & Equalizer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#0057FF]/10 text-[#0057FF] border border-[#0057FF]/20">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {metadata.voice || 'Neural Speech Playback'}
            </h4>
            <p className="text-xs text-slate-500">
              {metadata.charCount ? `${metadata.charCount} characters` : 'Audio output'}
              {metadata.wordCount ? ` • ${metadata.wordCount} words` : ''}
              {metadata.fileSize ? ` • ${formatBytes(metadata.fileSize)}` : ''}
              {metadata.audioFormat ? ` • ${metadata.audioFormat.toUpperCase()}` : ''}
            </p>
          </div>
        </div>

        {/* Animated Equalizer Visualizer */}
        <div className="flex items-end gap-1 h-5 px-3 py-1 bg-[#F8F7F4] border border-slate-200 rounded-lg">
          <span
            className={`w-1 bg-[#0057FF] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-4 animate-pulse' : 'h-1.5 opacity-40'
            }`}
          />
          <span
            className={`w-1 bg-[#0057FF] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-3 animate-pulse delay-75' : 'h-2 opacity-40'
            }`}
          />
          <span
            className={`w-1 bg-[#0057FF] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-5 animate-pulse delay-150' : 'h-1 opacity-40'
            }`}
          />
          <span
            className={`w-1 bg-[#0057FF] rounded-full transition-all duration-300 ${
              isPlaying ? 'h-2.5 animate-pulse delay-100' : 'h-1.5 opacity-40'
            }`}
          />
        </div>
      </div>

      {/* Timeline Scrubber (Seek) */}
      <div className="space-y-1.5">
        <div className="relative flex items-center group">
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0057FF] focus:outline-none"
            style={{
              background: `linear-gradient(to right, #0057FF ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
            }}
            title="Seek playback position"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Playback & Audio Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Left: Play/Pause, Rewind, Fast-Forward */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Rewind 5s */}
          <button
            type="button"
            onClick={() => handleSkip(-5)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Rewind 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-11 h-11 rounded-full flex items-center justify-center text-white transition shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-[#0057FF] hover:bg-[#0047db] shadow-[#0057FF]/30 scale-105'
                : 'bg-[#0057FF] hover:bg-[#0047db] shadow-[#0057FF]/20 hover:scale-105'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          {/* Fast-Forward 5s */}
          <button
            type="button"
            onClick={() => handleSkip(5)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Volume Control */}
        <div className="flex items-center gap-2 bg-[#F8F7F4] px-3 py-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={toggleMute}
            className="text-slate-600 hover:text-[#0057FF] transition cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
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
            className="w-16 sm:w-20 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0057FF] focus:outline-none"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />

          <span className="text-[10px] font-mono text-slate-500 w-7 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* Right: Playback Speed Chips */}
        <div className="flex items-center gap-1 bg-[#F8F7F4] p-1 rounded-xl border border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 flex items-center gap-1">
            <Gauge className="w-3 h-3 text-[#0057FF]" />
            Speed
          </span>
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => setPlaybackRate(rate)}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                playbackRate === rate
                  ? 'bg-[#0057FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Action Footer: Copy Link and Download File */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-500 font-mono text-[11px] truncate max-w-xs">
          {filename || 'audio.mp3'}
        </span>

        <div className="flex items-center gap-2">
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer shadow-xs font-medium"
              title="Copy audio URL"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          )}

          <a
            href={src}
            download={filename || 'generated-speech.mp3'}
            className="px-3.5 py-1.5 rounded-xl bg-[#0057FF] hover:bg-[#0047db] text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-[#0057FF]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MP3</span>
          </a>
        </div>
      </div>
    </div>
  )
}
