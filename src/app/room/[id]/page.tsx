'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useRoom } from '@/hooks/useRoom'
import { useLocations } from '@/hooks/useLocations'
import Panel from '@/components/Panel'
import type { Venue, RouteResult } from '@/types'

// Leaflet must be dynamically imported — it uses window, can't SSR
const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const { room, loading: roomLoading, error } = useRoom(id)
  const { locations, addLocation, removeLocation, updateTravelTime, clearAll } = useLocations(id)

  const [midpoint, setMidpoint] = useState<{ lat: number; lng: number } | null>(null)
  const [routes, setRoutes] = useState<RouteResult[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null)

  const handleMidpointFound = useCallback((
    mid: { lat: number; lng: number },
    r: RouteResult[],
    v: Venue[]
  ) => {
    setMidpoint(mid)
    setRoutes(r)
    setVenues(v)
  }, [])

  const handleClearAll = useCallback(async () => {
    await clearAll()
    setMidpoint(null)
    setRoutes([])
    setVenues([])
    setActiveVenue(null)
  }, [clearAll])

  if (roomLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white text-center">
        <div className="text-4xl mb-3 animate-bounce">📍</div>
        <p className="text-blue-300">Loading room…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white text-center">
        <div className="text-4xl mb-3">😕</div>
        <p className="text-lg font-bold">Room not found</p>
        <a href="/" className="text-blue-400 text-sm mt-2 block hover:underline">← Create a new room</a>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Header */}
      <header className="bg-slate-900 text-white px-5 py-3 flex items-center gap-3 flex-shrink-0 z-10">
        <a href="/" className="text-xl">📍</a>
        <h1 className="font-bold text-sm tracking-tight">Meet In The Middle</h1>
        <span className="bg-white/10 text-white/60 text-xs px-2.5 py-1 rounded-full">
          {id}
        </span>
        <div className="ml-auto flex items-center gap-2 text-xs text-white/50">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          {locations.length} {locations.length === 1 ? 'person' : 'people'} in room
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <Map
            locations={locations}
            midpoint={midpoint}
            routes={routes}
            venues={venues}
            onVenueClick={setActiveVenue}
          />
        </div>

        <Panel
          roomName={room?.name ?? id}
          roomId={id}
          locations={locations}
          onAdd={addLocation}
          onRemove={removeLocation}
          onUpdateTravelTime={updateTravelTime}
          onClearAll={handleClearAll}
          onMidpointFound={handleMidpointFound}
        />
      </div>

      {/* Venue detail bottom sheet */}
      {activeVenue && (
        <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-80 md:bottom-6 md:left-6 z-50">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl p-5 border border-gray-100">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{activeVenue.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{activeVenue.tags.name}</p>
                <p className="text-sm text-gray-500 capitalize">{activeVenue.label}</p>
                {activeVenue.tags.opening_hours && (
                  <p className="text-xs text-gray-400 mt-1">🕐 {activeVenue.tags.opening_hours}</p>
                )}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${activeVenue.lat}&mlon=${activeVenue.lon}&zoom=17`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 font-semibold mt-2 inline-block hover:underline"
                >
                  Open in maps →
                </a>
              </div>
              <button
                onClick={() => setActiveVenue(null)}
                className="text-gray-300 hover:text-gray-500 text-xl leading-none"
              >×</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}