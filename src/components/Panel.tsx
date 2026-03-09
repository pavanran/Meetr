'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { search as geoSearch, reverse } from '@/lib/geocode'
import { getRoute } from '@/lib/routing'
import { fetchVenues } from '@/lib/venues'
import { centroid, fmtTime } from '@/lib/geo'
import type { Location, TravelMode, Venue, RouteResult } from '@/types'

const MODE_OPTIONS: { mode: TravelMode; emoji: string; label: string }[] = [
  { mode: 'foot-walking',    emoji: '🚶', label: 'Walk'    },
  { mode: 'cycling-regular', emoji: '🚲', label: 'Cycle'   },
  { mode: 'driving-car',     emoji: '🚗', label: 'Drive'   },
  { mode: 'transit',         emoji: '🚇', label: 'Transit' },
]

interface PanelProps {
  roomName: string
  roomId: string
  locations: Location[]
  onAdd: (name: string, placeName: string, lat: number, lng: number, mode: TravelMode) => Promise<void>
  onRemove: (id: string) => Promise<void>
  onUpdateTravelTime: (id: string, time: string) => Promise<void>
  onClearAll: () => Promise<void>
  onMidpointFound: (mid: { lat: number; lng: number }, routes: RouteResult[], venues: Venue[]) => void
}

export default function Panel({
  roomName, roomId, locations,
  onAdd, onRemove, onUpdateTravelTime, onClearAll, onMidpointFound
}: PanelProps) {
  const [mode, setMode] = useState<TravelMode>('foot-walking')
  const [nickname, setNickname] = useState('')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ lat: number; lng: number; shortName: string; displayName: string }[]>([])
  const [showSugg, setShowSugg] = useState(false)
  const [finding, setFinding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [midName, setMidName] = useState('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [copiedVenue, setCopiedVenue] = useState<number | null>(null)

  function parseMins(t: string | null): number {
    if (!t) return 0
    const h = t.match(/(\d+)h/), m = t.match(/(\d+)\s*min/)
    return (h ? +h[1] * 60 : 0) + (m ? +m[1] : 0) || (t.includes('<1') ? 0.5 : 0)
  }
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Autocomplete
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!query.trim()) { setSuggestions([]); setShowSugg(false); return }
    searchTimer.current = setTimeout(async () => {
      const res = await geoSearch(query)
      setSuggestions(res)
      setShowSugg(true)
    }, 350)
  }, [query])

  const pickSuggestion = useCallback(async (s: typeof suggestions[0]) => {
    if (!nickname.trim()) { alert('Enter your name first!'); return }
    await onAdd(nickname.trim(), s.shortName, s.lat, s.lng, mode)
    setQuery('')
    setSuggestions([])
    setShowSugg(false)
  }, [nickname, mode, onAdd])

  const handleGPS = useCallback(() => {
    if (!nickname.trim()) { alert('Enter your name first!'); return }
    if (!navigator.geolocation) { alert('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      const placeName = await reverse(lat, lng)
      await onAdd(nickname.trim(), placeName, lat, lng, mode)
    })
  }, [nickname, mode, onAdd])

  const findMidpoint = useCallback(async () => {
    if (locations.length < 2) return
    setFinding(true)
    const mid = centroid(locations)

    // Parallel: routes + reverse geocode + venues
    const [routeResults, areaName, venueList] = await Promise.all([
      Promise.all(locations.map(l => getRoute(l.lat, l.lng, mid.lat, mid.lng, l.mode))),
      reverse(mid.lat, mid.lng),
      fetchVenues(mid.lat, mid.lng, 1000),
    ])

    setMidName(areaName)
    setVenues(venueList)

    // Update travel times in DB
    await Promise.all(routeResults.map((r, i) => {
      if (r) return onUpdateTravelTime(locations[i].id, fmtTime(r.duration))
    }))

    onMidpointFound(
      mid,
      routeResults.filter(Boolean) as RouteResult[],
      venueList
    )
    setFinding(false)
  }, [locations, onMidpointFound, onUpdateTravelTime])

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <aside className="w-80 flex-shrink-0 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Room header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Room</p>
            <p className="font-bold text-gray-800">{roomName}</p>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition-all"
          >
            {copied ? '✅ Copied!' : '🔗 Share'}
          </button>
        </div>

        {/* Nickname */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">Your name</label>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="e.g. Pavan"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Travel mode */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Travel mode</label>
          <div className="grid grid-cols-4 gap-1.5">
            {MODE_OPTIONS.map(o => (
              <button
                key={o.mode}
                onClick={() => setMode(o.mode)}
                className={`flex flex-col items-center py-2 rounded-lg border text-xs font-semibold transition-all ${
                  mode === o.mode
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
                }`}
              >
                <span className="text-lg">{o.emoji}</span>
                <span className="mt-0.5">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">Add location</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              onFocus={() => suggestions.length && setShowSugg(true)}
              placeholder="Search a place…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
          {showSugg && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={() => pickSuggestion(s)}
                  className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0"
                >
                  <p className="font-semibold text-gray-800">{s.shortName}</p>
                  <p className="text-xs text-gray-400 truncate">{s.displayName.split(',').slice(1, 3).join(',')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* GPS button */}
        <button
          onClick={handleGPS}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 bg-white transition-all"
        >
          📡 Use my current location
        </button>

        {/* Location list */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">People ({locations.length})</p>
            {locations.map(loc => (
              <div key={loc.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: loc.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{loc.name}</p>
                  <p className="text-xs text-gray-400 truncate">{loc.place_name}</p>
                  {loc.travel_time && (
                    <span className="text-xs font-bold text-blue-500 bg-blue-50 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                      {loc.travel_time}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onRemove(loc.id)}
                  className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Midpoint area name + fairness */}
        {midName && (
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 space-y-3">
            <div>
              <p className="text-xs opacity-75 uppercase tracking-wider font-semibold">📍 Meetup area</p>
              <p className="text-lg font-bold mt-1">{midName}</p>
              <p className="text-xs opacity-75 mt-1">{locations.length} people · 1km radius</p>
            </div>
            {/* Fairness bars */}
            {locations.some(l => l.travel_time) && (
              <div>
                <p className="text-xs opacity-75 font-semibold mb-2">⚖️ Travel fairness</p>
                <div className="space-y-1.5">
                  {locations.map(l => {
                    const mins = parseMins(l.travel_time)
                    const maxMins = Math.max(...locations.map(x => parseMins(x.travel_time)), 1)
                    return (
                      <div key={l.id} className="flex items-center gap-2 text-xs">
                        <span className="w-16 truncate opacity-80">{l.name}</span>
                        <div className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.round(mins / maxMins * 100)}%`, background: l.color }}
                          />
                        </div>
                        <span className="w-10 text-right opacity-80 font-semibold">{l.travel_time ?? '?'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nearby venues */}
        {venues.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Nearby spots</p>
            <div className="space-y-2">
              {venues.map(v => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2.5 transition-all hover:border-blue-400 hover:shadow-sm"
                >
                  <span className="text-xl">{v.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.tags.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{v.label}</p>
                  </div>
                  <button
                    onClick={() => {
                      const text = `${v.tags.name} — https://www.google.com/maps?q=${v.lat},${v.lon}`
                      navigator.clipboard.writeText(text)
                      setCopiedVenue(v.id)
                      setTimeout(() => setCopiedVenue(null), 2000)
                    }}
                    className="flex-shrink-0 text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                    title="Copy location"
                  >
                    {copiedVenue === v.id ? '✅' : '📋'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {locations.length >= 2 && (
          <div className="flex gap-2">
            <button
              onClick={findMidpoint}
              disabled={finding}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-60"
            >
              {finding ? '⏳ Calculating…' : '🎯 Find midpoint'}
            </button>
            <button
              onClick={onClearAll}
              className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-red-500 hover:border-red-200 text-sm font-semibold transition-all"
            >✕</button>
          </div>
        )}

        {locations.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🗺️</p>
            <p className="text-sm">Add 2+ locations to find your perfect meetup spot</p>
          </div>
        )}
      </div>
    </aside>
  )
}