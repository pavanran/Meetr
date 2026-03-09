'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createRoom } from '@/hooks/useRoom'

// --- Animated pin that floats around the map ---
interface Pin { id: number; x: number; y: number; color: string; name: string; delay: number }

const DEMO_PINS: Pin[] = [
  { id: 1, x: 22, y: 30, color: '#3b6fd4', name: 'Alex',  delay: 0    },
  { id: 2, x: 70, y: 20, color: '#e53e3e', name: 'Priya', delay: 0.4  },
  { id: 3, x: 55, y: 65, color: '#38a169', name: 'Jordan',delay: 0.8  },
  { id: 4, x: 15, y: 68, color: '#d69e2e', name: 'Sam',   delay: 1.2  },
]
const MIDPOINT = { x: 42, y: 47 }

const VENUE_CHIPS = ['🍽️ Barrafina', '☕ Monmouth', '🍺 The Anchor', '🌳 Hyde Park', '🎬 Picturehouse', '🍜 Dishoom']

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pinsVisible, setPinsVisible] = useState(false)
  const [midVisible, setMidVisible] = useState(false)
  const [linesVisible, setLinesVisible] = useState(false)
  const [venueIdx, setVenueIdx] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const heroRef = useRef<HTMLDivElement>(null)

  // Orchestrate the demo animation
  useEffect(() => {
    const t1 = setTimeout(() => setPinsVisible(true), 600)
    const t2 = setTimeout(() => setLinesVisible(true), 1400)
    const t3 = setTimeout(() => setMidVisible(true), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Cycle venue chips
  useEffect(() => {
    const iv = setInterval(() => setVenueIdx(i => (i + 1) % VENUE_CHIPS.length), 2000)
    return () => clearInterval(iv)
  }, [])

  // Parallax mouse tracking
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const room = await createRoom(name.trim())
    if (room) router.push(`/room/${room.id}`)
    else { alert('Failed — check Supabase config'); setLoading(false) }
  }

  const blobX = (mousePos.x - 50) * 0.3
  const blobY = (mousePos.y - 50) * 0.3

  return (
    <main
      ref={heroRef}
      onMouseMove={onMouseMove}
      className="min-h-screen bg-[#06090f] text-white overflow-hidden relative flex flex-col select-none"
    >
      {/* ── Grid texture ── */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(59,111,212,0.07) 1px, transparent 1px),linear-gradient(90deg,rgba(59,111,212,0.07) 1px,transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Parallax blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute rounded-full bg-blue-600/25 blur-[140px] w-[700px] h-[700px] -top-60 -left-40 transition-transform duration-700 ease-out"
          style={{ transform: `translate(${blobX * 0.8}px,${blobY * 0.8}px)` }} />
        <div className="absolute rounded-full bg-violet-600/20 blur-[120px] w-[500px] h-[500px] top-1/2 -right-40 transition-transform duration-700 ease-out"
          style={{ transform: `translate(${-blobX * 0.5}px,${-blobY * 0.5}px)` }} />
        <div className="absolute rounded-full bg-indigo-500/15 blur-[100px] w-[400px] h-[400px] -bottom-20 left-1/3 transition-transform duration-700 ease-out"
          style={{ transform: `translate(${blobX * 0.3}px,${blobY * 0.3}px)` }} />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📍</span>
          <span className="font-black text-lg tracking-tight">MeetMiddle</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-xs text-green-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · Open Source
          </span>
          <a href="https://github.com" target="_blank" rel="noreferrer"
            className="text-white/30 hover:text-white text-sm transition-colors">GitHub ↗</a>
        </div>
      </nav>

      {/* ── Main content ── */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-center flex-1 gap-12 px-8 py-12 max-w-7xl mx-auto w-full">

        {/* Left: copy + CTA */}
        <div className="flex-1 flex flex-col items-start max-w-xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs text-blue-300 font-semibold mb-6">
            ✨ No account needed · Rooms expire in 24h
          </div>

          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            Stop arguing<br />
            about{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                where to meet
              </span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M0 6 Q50 0 100 5 Q150 10 200 4" stroke="url(#u)" strokeWidth="2.5" strokeLinecap="round"/>
                <defs><linearGradient id="u" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa"/><stop offset="1" stopColor="#a78bfa"/>
                </linearGradient></defs>
              </svg>
            </span>
          </h1>

          <p className="text-white/45 text-lg leading-relaxed mb-8">
            Share a link. Everyone drops their pin. We calculate the <strong className="text-white/70">fairest midpoint</strong> with real travel times — not straight lines — and surface the best spots nearby.
          </p>

          {/* Venue cycling chip */}
          <div className="flex items-center gap-3 mb-10">
            <span className="text-white/30 text-sm">Finding spots like</span>
            <div className="relative h-8 overflow-hidden">
              {VENUE_CHIPS.map((v, i) => (
                <span
                  key={v}
                  className="absolute left-0 top-0 bg-white/8 border border-white/10 rounded-full px-3 py-1 text-sm font-medium text-white/70 whitespace-nowrap transition-all duration-500"
                  style={{
                    opacity: i === venueIdx ? 1 : 0,
                    transform: i === venueIdx ? 'translateY(0)' : i < venueIdx ? 'translateY(-120%)' : 'translateY(120%)',
                  }}
                >{v}</span>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="group relative flex items-center gap-3 bg-blue-500 hover:bg-blue-400 px-8 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-blue-500/40 transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Get started — it's free</span>
              <span className="relative group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="w-full max-w-sm space-y-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name your group… e.g. Friday crew"
                autoFocus
                className="w-full px-5 py-4 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/25 focus:outline-none focus:border-blue-400 text-sm font-medium transition-all"
              />
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 font-black text-sm transition-all shadow-xl shadow-blue-500/30"
              >
                {loading ? '⏳ Creating your room…' : '🚀 Create room & get link'}
              </button>
            </form>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-8 mt-10 pt-10 border-t border-white/5 w-full">
            {[
              { n: '100%', label: 'Free & open source' },
              { n: '<2s',  label: 'To find midpoint' },
              { n: '6',    label: 'People per room' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white">{s.n}</p>
                <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: interactive map demo */}
        <div className="flex-1 flex items-center justify-center w-full max-w-lg lg:max-w-none">
          <div
            className="relative w-full aspect-square max-w-[480px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
            style={{ transform: `perspective(1000px) rotateX(${(mousePos.y-50)*0.03}deg) rotateY(${-(mousePos.x-50)*0.03}deg)` }}
          >
            {/* Fake map background */}
            <div className="absolute inset-0 bg-[#1a2035]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(59,111,212,0.06) 1px,transparent 1px),
                  linear-gradient(90deg,rgba(59,111,212,0.06) 1px,transparent 1px),
                  radial-gradient(circle at 42% 47%, rgba(108,99,255,0.12) 0%, transparent 60%)
                `,
                backgroundSize: '40px 40px, 40px 40px, 100% 100%',
              }}
            />

            {/* Fake roads */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 35 Q30 32 50 40 Q70 48 100 42" stroke="#3b6fd4" strokeWidth="0.8" fill="none"/>
              <path d="M20 0 Q25 30 22 50 Q19 70 25 100" stroke="#3b6fd4" strokeWidth="0.8" fill="none"/>
              <path d="M0 65 Q40 60 60 67 Q80 74 100 68" stroke="#3b6fd4" strokeWidth="0.5" fill="none"/>
              <path d="M60 0 Q58 25 62 50 Q66 75 60 100" stroke="#3b6fd4" strokeWidth="0.5" fill="none"/>
              <path d="M0 85 Q50 80 100 85" stroke="#3b6fd4" strokeWidth="0.4" fill="none"/>
              <path d="M80 0 Q82 50 80 100" stroke="#3b6fd4" strokeWidth="0.4" fill="none"/>
            </svg>

            {/* Route lines from pins to midpoint */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {DEMO_PINS.map(pin => (
                <line
                  key={pin.id}
                  x1={pin.x} y1={pin.y} x2={MIDPOINT.x} y2={MIDPOINT.y}
                  stroke={pin.color}
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                  opacity={linesVisible ? 0.7 : 0}
                  style={{ transition: `opacity 0.6s ease ${pin.delay}s` }}
                />
              ))}
            </svg>

            {/* Person pins */}
            {DEMO_PINS.map(pin => (
              <div
                key={pin.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${pin.x}%`, top: `${pin.y}%`,
                  transform: 'translate(-50%,-50%)',
                  opacity: pinsVisible ? 1 : 0,
                  transition: `opacity 0.4s ease ${pin.delay}s, transform 0.4s ease ${pin.delay}s`,
                  ...(pinsVisible ? {} : { transform: 'translate(-50%,-80%)' }),
                }}
              >
                <div className="relative">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                    style={{ background: pin.color, boxShadow: `0 0 12px ${pin.color}88` }}
                  />
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-40"
                    style={{ background: pin.color }}
                  />
                </div>
                <div className="mt-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap border border-white/10">
                  {pin.name}
                </div>
              </div>
            ))}

            {/* Midpoint marker */}
            <div
              className="absolute flex flex-col items-center"
              style={{
                left: `${MIDPOINT.x}%`, top: `${MIDPOINT.y}%`,
                transform: 'translate(-50%,-50%)',
                opacity: midVisible ? 1 : 0,
                transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                ...(midVisible ? {} : { transform: 'translate(-50%,-50%) scale(0)' }),
              }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white shadow-2xl"
                style={{ background: 'linear-gradient(135deg,#3b6fd4,#6c63ff)', boxShadow: '0 0 24px #6c63ff88' }}>
                🎯
              </div>
              <div className="mt-1 bg-indigo-600/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap border border-indigo-400/30">
                MIDPOINT
              </div>
            </div>

            {/* Fairness overlay card */}
            <div
              className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3"
              style={{
                opacity: midVisible ? 1 : 0,
                transform: midVisible ? 'translateY(0)' : 'translateY(12px)',
                transition: 'all 0.5s ease 0.3s',
              }}
            >
              <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mb-2">⚖️ Travel fairness</p>
              <div className="space-y-1.5">
                {DEMO_PINS.map((pin, i) => {
                  const times = [12, 14, 11, 15]
                  const max = Math.max(...times)
                  return (
                    <div key={pin.id} className="flex items-center gap-2">
                      <span className="text-[10px] text-white/50 w-10 truncate">{pin.name}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{
                            width: midVisible ? `${Math.round(times[i]/max*100)}%` : '0%',
                            background: pin.color,
                            transitionDelay: `${0.4 + i * 0.1}s`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold w-8 text-right" style={{ color: pin.color }}>{times[i]}m</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top-right live badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-white/60 font-semibold">Live</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom feature strip ── */}
      <div className="relative z-10 border-t border-white/5 px-8 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { emoji: '🗺️', title: 'Mapbox Maps',     sub: 'Beautiful modern tiles' },
            { emoji: '🛣️', title: 'Real Routing',     sub: 'OSRM, not straight lines' },
            { emoji: '⚡', title: 'Live Sync',        sub: 'Supabase WebSockets' },
            { emoji: '⚖️', title: 'Fairness Score',   sub: 'See travel times side by side' },
            { emoji: '🍽️', title: 'Venue Discovery',  sub: 'Overpass API, free forever' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{f.emoji}</span>
              <div>
                <p className="text-sm font-bold text-white/80">{f.title}</p>
                <p className="text-xs text-white/30 mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  )
}