'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  MessageSquare, BarChart3, Brain, Clock,
  ChevronRight, Settings, Monitor, Wifi,
  Shield, Maximize2, Volume2, VolumeX, ChevronLeft,
  Award, TrendingUp, Zap, Star, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type InterviewRound = 'intro' | 'technical' | 'behavioral' | 'salary'

const rounds: { id: InterviewRound; label: string; color: string; icon: string }[] = [
  { id: 'intro', label: 'Introduction', color: '#6366f1', icon: '👋' },
  { id: 'technical', label: 'Technical', color: '#a855f7', icon: '💻' },
  { id: 'behavioral', label: 'Behavioural', color: '#f59e0b', icon: '🧠' },
  { id: 'salary', label: 'Salary', color: '#22c55e', icon: '💰' },
]

const mockTranscript = [
  { speaker: 'ai', text: "Hello! I'm HireAI, your interviewer today. I've reviewed your resume and I'm excited to learn more about your experience. Could you start by briefly walking me through your background?" },
  { speaker: 'candidate', text: 'Sure! I have 6 years of experience in frontend development, primarily with React and TypeScript. At my current company, I lead a team of 4 developers building real-time analytics dashboards...' },
  { speaker: 'ai', text: "That's impressive! You mentioned real-time analytics — tell me about the technical architecture you used for data streaming. What challenges did you face at scale?" },
  { speaker: 'candidate', text: 'We used WebSocket connections with Redis pub/sub on the backend. The main challenge was handling reconnection logic when connections dropped, and managing state consistency across browser tabs...' },
]

function VoiceBars({ active, color = '#818cf8', size = 'md' }: { active: boolean; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const heights = size === 'lg' ? [12, 20, 28, 20, 12] : size === 'sm' ? [6, 10, 14, 10, 6] : [8, 14, 20, 14, 8]
  return (
    <div className={`flex items-end gap-[3px] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-20'}`}>
      {heights.map((h, i) => (
        <div key={i}
          className={`w-[3px] rounded-full ${active ? 'voice-bar' : ''}`}
          style={{
            height: active ? `${h}px` : '3px',
            animationDelay: `${i * 0.12}s`,
            background: color,
            transition: 'height 0.3s ease',
          }} />
      ))}
    </div>
  )
}

function ScoreRing({ score, label, color, size = 72 }: { score: number; label: string; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90 absolute inset-0" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black text-white">{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{label}</span>
    </div>
  )
}

function PulseRing({ active, color }: { active: boolean; color: string }) {
  if (!active) return null
  return (
    <>
      <div className="absolute -inset-3 rounded-full animate-ping opacity-20" style={{ background: color, animationDuration: '1.5s' }} />
      <div className="absolute -inset-6 rounded-full animate-ping opacity-10" style={{ background: color, animationDuration: '1.5s', animationDelay: '0.3s' }} />
    </>
  )
}

export default function InterviewRoom({ params }: { params: { interviewId: string } }) {
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [currentRound, setCurrentRound] = useState<InterviewRound>('intro')
  const [elapsed, setElapsed] = useState(0)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const aiSpeakingRef = useRef(false)
  const [candidateSpeaking, setCandidateSpeaking] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [scores, setScores] = useState({ technical: 0, communication: 0, confidence: 0 })
  const [transcript, setTranscript] = useState<{ speaker: string; text: string }[]>([])
  const [activePanel, setActivePanel] = useState<'transcript' | 'insights' | null>('transcript')
  const [showRoundTransition, setShowRoundTransition] = useState(false)
  const prevRoundRef = useRef<InterviewRound>('intro')
  const transcriptRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueue = useRef<string[]>([])
  const isPlaying = useRef(false)

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    return () => { audioContextRef.current?.close() }
  }, [])

  const processQueue = async () => {
    if (isPlaying.current || audioQueue.current.length === 0 || !audioContextRef.current) return
    isPlaying.current = true
    const base64Audio = audioQueue.current.shift()!
    try {
      setAiSpeaking(true); aiSpeakingRef.current = true
      const bytes = new Uint8Array(window.atob(base64Audio).split('').map(c => c.charCodeAt(0)))
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      source.onended = () => { setAiSpeaking(false); aiSpeakingRef.current = false; isPlaying.current = false; processQueue() }
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume()
      source.start(0)
    } catch {
      setAiSpeaking(false); aiSpeakingRef.current = false; isPlaying.current = false; processQueue()
    }
  }

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(`${protocol}//localhost:8002/ws/v1/interview/${params.interviewId || 'test'}?token=mock`)
    socketRef.current = socket
    ;(window as any).debugSocket = socket
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'ai_response') {
        if (msg.data.text) setTranscript(prev => [...prev, { speaker: 'ai', text: msg.data.text }])
        if (msg.data.audio_b64) { audioQueue.current.push(msg.data.audio_b64); processQueue() }
        if (msg.data.round) setCurrentRound(msg.data.round)
      } else if (msg.type === 'scores_update') {
        setScores(prev => ({ ...prev, ...msg.data }))
      } else if (msg.type === 'interview_ended') {
        window.location.href = '/candidate/success'
      }
    }
    return () => socket.close()
  }, [])

  // Handle Round Transitions
  useEffect(() => {
    if (prevRoundRef.current !== currentRound) {
      setShowRoundTransition(true)
      const timer = setTimeout(() => setShowRoundTransition(false), 3000)
      prevRoundRef.current = currentRound
      return () => clearTimeout(timer)
    }
  }, [currentRound])

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (camOn && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream })
        .catch(() => {})
    }
  }, [camOn])

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [transcript, aiSpeaking])

  const endInterview = () => {
    setIsEnding(true)
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'end_interview', data: {} }))
      // Fallback redirect after 1.5s if server doesn't respond
      setTimeout(() => {
        window.location.href = '/candidate/success'
      }, 1500)
    } else {
      // Immediate redirect if socket is dead
      window.location.href = '/candidate/success'
    }
  }

  const handleSendText = () => {
    if (!inputText.trim() || isSending) return
    setIsSending(true)
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'transcript',
        data: { text: inputText, speaker: 'candidate' }
      }))
      setTranscript(prev => [...prev, { speaker: 'candidate', text: inputText }])
      setInputText('')
      setTimeout(() => setIsSending(false), 500)
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const currentRoundIndex = rounds.findIndex(r => r.id === currentRound)
  const currentRoundData = rounds.find(r => r.id === currentRound)!

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans" style={{ background: '#0a0c10' }}>

      {/* ── Header ── */}
      <header className="h-14 shrink-0 flex items-center px-5 gap-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(13,15,22,0.95)', backdropFilter: 'blur(20px)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 mr-4">
          <Image src="/hireai-logo.png" alt="HireAI Logo" width={42} height={42} className="rounded-xl shadow-xl object-cover ring-2 ring-white/10" />
          <div>
            <div className="text-white font-bold text-base leading-none">HireAI</div>
            <div className="text-white/40 text-[11px] leading-none mt-1 uppercase tracking-wider">Interview Room</div>
          </div>
        </div>

        <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Round Progress */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {rounds.map((r, i) => {
              const isCurrent = r.id === currentRound
              const isPast = i < currentRoundIndex
              return (
                <div key={r.id} className="flex items-center">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isCurrent ? 1.05 : 1,
                      backgroundColor: isCurrent ? r.color : isPast ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-500 tracking-wider ${isCurrent ? 'text-white' : isPast ? 'text-white/60' : 'text-white/30'}`}
                    style={isCurrent ? { 
                      boxShadow: `0 0 30px ${r.color}40, inset 0 0 10px rgba(255,255,255,0.2)`,
                      border: `1px solid ${r.color}60`
                    } : { border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="w-5 h-5 flex items-center justify-center rounded-lg bg-black/20">
                      {isPast ? <span className="text-emerald-400 text-xs">✓</span> : <span className="text-xs">{r.icon}</span>}
                    </div>
                    <span className="uppercase">{r.label}</span>
                  </motion.div>
                  {i < rounds.length - 1 && (
                    <div className="w-6 h-px mx-1 bg-white/10" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Status + Time */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#10b981' }}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </div>
          <div className="flex items-center gap-1.5 text-white/60 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsed)}
          </div>
          <div className="flex items-center gap-1.5 text-white/50 text-xs px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">HD</span>
          </div>
        </div>
      </header>

      {/* ── Main Area ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Video + Controls ── */}
        <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">

          {/* ── Video Grid ── */}
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">

            {/* AI Interviewer Panel */}
            <div className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0d1117 0%, #131820 100%)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: `0 0 40px rgba(99,102,241,0.08)` }}>

              {/* Corner accent */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

              {/* Grid texture */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }} />

              {/* Ambient glow when speaking */}
              <div className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.15), transparent 70%)', opacity: aiSpeaking ? 1 : 0 }} />

              {/* Label */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-xl"
                style={{ background: 'rgba(13,15,22,0.8)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                <Brain className="w-3.5 h-3.5" />
                HireAI Interviewer
                {aiSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
              </div>

              {/* Round badge */}
              <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-xl"
                style={{ background: currentRoundData.color + '20', border: `1px solid ${currentRoundData.color}40`, color: currentRoundData.color }}>
                {currentRoundData.icon} {currentRoundData.label}
              </div>

              {/* AI Avatar */}
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative">
                  <PulseRing active={aiSpeaking} color="#6366f1" />
                  <div className={`relative w-44 h-44 rounded-full overflow-hidden transition-all duration-500`}
                    style={{
                      border: aiSpeaking ? '3px solid #6366f1' : '3px solid rgba(255,255,255,0.08)',
                      boxShadow: aiSpeaking ? '0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.15)' : '0 8px 32px rgba(0,0,0,0.5)'
                    }}>
                    <Image src="/avatars/hireai-avatar.png" alt="HireAI" fill className="object-cover" priority />
                  </div>
                </div>

                {/* Voice visualizer */}
                <div className="flex flex-col items-center gap-2">
                  <VoiceBars active={aiSpeaking} color="#6366f1" size="lg" />
                  <span className="text-xs font-semibold" style={{ color: aiSpeaking ? '#a5b4fc' : 'rgba(255,255,255,0.3)' }}>
                    {aiSpeaking ? 'Speaking...' : 'Listening...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate Camera Panel */}
            <div className="relative rounded-2xl overflow-hidden"
              style={{ background: '#111317', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 0 40px rgba(16,185,129,0.06)' }}>

              {/* Corner accent */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />

              {/* Label */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-xl"
                style={{ background: 'rgba(13,15,22,0.8)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>YOU</div>
                Candidate Camera
                {candidateSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </div>

              {/* Cam-on glow */}
              {candidateSpeaking && <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(16,185,129,0.15)' }} />}

              {/* Video */}
              {camOn ? (
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <VideoOff className="w-10 h-10 text-white/20" />
                  </div>
                  <span className="text-sm text-white/30 font-medium">Camera is off</span>
                </div>
              )}

              {/* Speaking indicator */}
              <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2.5 rounded-full backdrop-blur-xl transition-all duration-300 ${candidateSpeaking ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <VoiceBars active={candidateSpeaking} color="#10b981" size="sm" />
                <span className="text-xs font-semibold" style={{ color: '#6ee7b7' }}>You are speaking</span>
              </div>
            </div>
          </div>

          {/* ── Controls Dock ── */}
          <div className="shrink-0 flex items-center justify-center gap-4">
            <div className="flex items-center gap-3 px-6 py-3.5 rounded-full backdrop-blur-2xl shadow-2xl" 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

              {/* Mic */}
              <button onClick={() => setMicOn(!micOn)} title={micOn ? 'Mute' : 'Unmute'}
                className="group relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ background: micOn ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.2)', border: micOn ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239,68,68,0.4)', boxShadow: micOn ? 'none' : '0 0 20px rgba(239,68,68,0.2)' }}>
                {micOn ? <Mic className="w-5 h-5 text-white/90" /> : <MicOff className="w-5 h-5 text-red-400" />}
              </button>

              {/* Camera */}
              <button onClick={() => setCamOn(!camOn)} title={camOn ? 'Hide Camera' : 'Show Camera'}
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ background: camOn ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.2)', border: camOn ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239,68,68,0.4)', boxShadow: camOn ? 'none' : '0 0 20px rgba(239,68,68,0.2)' }}>
                {camOn ? <Video className="w-5 h-5 text-white/90" /> : <VideoOff className="w-5 h-5 text-red-400" />}
              </button>

              {/* Speaker */}
              <button onClick={() => setSpeakerOn(!speakerOn)} title={speakerOn ? 'Mute Audio' : 'Unmute Audio'}
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ background: speakerOn ? 'rgba(255,255,255,0.08)' : 'rgba(239,68,68,0.2)', border: speakerOn ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239,68,68,0.4)', boxShadow: speakerOn ? 'none' : '0 0 20px rgba(239,68,68,0.2)' }}>
                {speakerOn ? <Volume2 className="w-5 h-5 text-white/90" /> : <VolumeX className="w-5 h-5 text-red-400" />}
              </button>

              <div className="w-px h-8 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

              {/* Settings */}
              <button onClick={() => setShowSettings(true)}
                className="group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }} title="Device Settings">
                <Settings className="w-5 h-5 text-white/50 group-hover:text-white/80" />
              </button>
            </div>

            {/* End Call - separated */}
            <button onClick={endInterview} title="End Interview" disabled={isEnding}
              className={`flex items-center gap-2.5 font-bold text-sm px-8 py-3.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${isEnding ? 'opacity-50 cursor-not-allowed text-white/50' : 'text-white'}`}
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 8px 32px rgba(220,38,38,0.3)', border: '1px solid rgba(220,38,38,0.6)' }}>
              {isEnding ? (
                <>
                  <BarChart3 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:block">Ending...</span>
                </>
              ) : (
                <>
                  <PhoneOff className="w-4 h-4" />
                  <span className="hidden sm:block">End Session</span>
                </>
              )}
            </button>
          </div>

          {/* ── Text Input / Hybrid Mode ── */}
          <div className="shrink-0 flex items-center gap-3 px-6 py-3 rounded-2xl mb-2 mx-auto w-full max-w-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder="Type your response here..."
              className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/20"
            />
            <button 
              onClick={handleSendText}
              disabled={!inputText.trim() || isSending}
              className={`p-2 rounded-xl transition-all ${inputText.trim() ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Right Side Panel ── */}
        <div className="w-80 flex flex-col shrink-0" style={{ background: 'rgba(13,15,22,0.95)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Panel Tabs */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { key: 'transcript', icon: MessageSquare, label: 'Transcript' },
              { key: 'insights', icon: BarChart3, label: 'Insights' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActivePanel(activePanel === tab.key as any ? null : tab.key as any)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold uppercase tracking-wide transition-all"
                style={{
                  color: activePanel === tab.key ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                  borderBottom: activePanel === tab.key ? '2px solid #6366f1' : '2px solid transparent',
                }}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Transcript Panel */}
          {activePanel === 'transcript' && (
            <div ref={transcriptRef} className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {(transcript.length > 0 ? transcript : mockTranscript).map((msg, i) => (
                <div key={i} className={`flex flex-col gap-1.5 ${msg.speaker !== 'ai' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 px-1">
                    {msg.speaker === 'ai' ? (
                      <>
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                          <Brain className="w-3 h-3 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">HireAI</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">You</span>
                        <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                          <span className="text-[8px] font-black text-emerald-400">Y</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className={`max-w-[95%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.speaker === 'ai'
                      ? 'rounded-tl-sm text-white/85'
                      : 'rounded-tr-sm text-white/90'
                  }`}
                    style={{
                      background: msg.speaker === 'ai' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                      border: msg.speaker === 'ai' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(16,185,129,0.2)',
                    }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* AI typing */}
              {aiSpeaking && (
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center gap-1.5 px-1">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                      <Brain className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">HireAI</span>
                  </div>
                  <div className="flex gap-1.5 px-4 py-3.5 rounded-2xl rounded-tl-sm" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#818cf8', animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Insights Panel */}
          {activePanel === 'insights' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Score Rings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black text-white/60 uppercase tracking-widest">Real-Time Scores</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <ScoreRing score={scores.technical} label="Technical" color="#6366f1" />
                  <ScoreRing score={scores.communication} label="Comms" color="#a855f7" />
                  <ScoreRing score={scores.confidence} label="Confidence" color="#10b981" />
                </div>
              </div>

              <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

              {/* Overall */}
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white/50">Overall Score</span>
                  <Award className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-4xl font-black text-white">
                  {Math.round((scores.technical + scores.communication + scores.confidence) / 3)}
                  <span className="text-lg text-white/30 font-medium">/100</span>
                </div>
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.round((scores.technical + scores.communication + scores.confidence) / 3)}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                </div>
              </div>

              <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">Session Info</span>
                </div>
                {[
                  { label: 'Current Round', value: currentRoundData.label, color: currentRoundData.color },
                  { label: 'Time Elapsed', value: formatTime(elapsed), color: '#60a5fa' },
                  { label: 'Connection', value: 'HD · Secure', color: '#34d399' },
                  { label: 'Interview ID', value: (params.interviewId || 'test').slice(0, 10) + '...', color: '#94a3b8' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="text-xs text-white/40">{item.label}</span>
                    <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

              {/* Security note */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/40 leading-relaxed">
                  End-to-end encrypted · GDPR compliant · No recording without consent
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" style={{ background: 'rgba(10,12,16,0.85)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
               style={{ background: '#131820', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)' }}>
            
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Device Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Camera Selection */}
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" /> Camera
                </label>
                <select className="w-full bg-[#0a0c10] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option>FaceTime HD Camera (Built-in)</option>
                  <option>Logitech Brio 4K WebCam</option>
                  <option>OBS Virtual Camera</option>
                </select>
              </div>

              {/* Microphone Selection */}
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" /> Microphone
                </label>
                <select className="w-full bg-[#0a0c10] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option>Default - Built-in Microphone</option>
                  <option>External Mic (USB Audio Device)</option>
                </select>
                
                {/* Visual Audio Input Level */}
                <div className="mt-3 flex items-center gap-3 px-1">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full w-[45%] animate-pulse" style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Input Detected</span>
                </div>
              </div>

              <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

              {/* Advanced Settings */}
              <div>
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">AI Background Noise Reduction</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Filter out ambient background noise like typing and dogs barking</div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                         style={{ background: 'rgba(255,255,255,0.1)' }} />
                    {/* Note: In tailwind peer-checked:bg-indigo-500 is standard but adding manual style for exact match if needed */}
                    <div className="w-11 h-6 rounded-full absolute top-0 left-0 transition-opacity opacity-0 peer-checked:opacity-100" style={{ background: '#6366f1' }} />
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end gap-3" style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setShowSettings(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors hover:scale-105 active:scale-95 shadow-lg"
                      style={{ background: '#6366f1' }}>
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Round Transition Overlay ── */}
      <AnimatePresence>
        {showRoundTransition && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] px-8 py-5 rounded-3xl backdrop-blur-3xl shadow-2xl flex flex-col items-center gap-3 border text-center"
            style={{ 
              background: 'rgba(13,15,22,0.85)', 
              borderColor: `${currentRoundData?.color || '#6366f1'}40`,
              boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 40px ${currentRoundData?.color || '#6366f1'}20`
            }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl shadow-black/20"
              style={{ background: `linear-gradient(135deg, ${currentRoundData?.color || '#6366f1'}, ${currentRoundData?.color || '#6366f1'}dd)` }}>
              {currentRoundData?.icon || '👋'}
            </div>
            <div>
              <div className="text-white/50 text-[10px] uppercase font-black tracking-[0.2em] mb-1">New Stage</div>
              <div className="text-white text-2xl font-black tracking-tight">{currentRoundData?.label || 'Introduction'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
