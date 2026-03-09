'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Location, Venue, RouteResult } from '@/types'
import { haversine } from '@/lib/geo'

interface MapProps {
  locations: Location[]
  midpoint: { lat: number; lng: number } | null
  routes: RouteResult[]
  venues: Venue[]
  onVenueClick: (venue: Venue) => void
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

function personIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;
      background:${color};
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,.35)
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

const midIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;
    background:linear-gradient(135deg,#3b6fd4,#6c63ff);
    border:3px solid #fff;border-radius:50%;
    box-shadow:0 4px 14px rgba(108,99,255,.55);
    display:flex;align-items:center;justify-content:center;
    font-size:15px
  ">🎯</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function venueIcon(emoji: string) {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:20px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

export default function Map({
  locations, midpoint, routes, venues, onVenueClick
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<L.Layer[]>([])

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      center: [51.505, -0.09],
      zoom: 5,
    })

    L.tileLayer(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://mapbox.com">Mapbox</a> © <a href="https://openstreetmap.org">OSM</a>',
        maxZoom: 19,
      }
    ).addTo(map)

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Re-render markers/routes whenever data changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old layers
    layersRef.current.forEach(l => map.removeLayer(l))
    layersRef.current = []

    const add = (l: L.Layer) => { l.addTo(map); layersRef.current.push(l) }

    // Person markers
    locations.forEach(loc => {
      const m = L.marker([loc.lat, loc.lng], { icon: personIcon(loc.color) })
        .bindPopup(`
          <b>${loc.name}</b><br>
          <span style="color:#718096;font-size:12px">${loc.place_name}</span>
          ${loc.travel_time ? `<br><span style="color:#3b6fd4;font-weight:600">${loc.travel_time}</span>` : ''}
        `)
      add(m)
    })

    // Routes
    routes.forEach((route, i) => {
      const loc = locations[i]
      if (!loc) return
      const line = L.polyline(route.coords, {
        color: loc.color,
        weight: 3,
        opacity: 0.75,
      })
      add(line)
    })

    // Midpoint marker
    if (midpoint) {
      const m = L.marker([midpoint.lat, midpoint.lng], { icon: midIcon })
        .bindPopup('<b>🎯 Your midpoint</b>')
      add(m)
    }

    // Venue markers
    venues.forEach(v => {
      const m = L.marker([v.lat, v.lon], { icon: venueIcon(v.emoji) })
        .bindPopup(`<b>${v.tags.name}</b><br><span style="color:#718096;font-size:12px">${v.label}</span>`)
        .on('click', () => onVenueClick(v))
      add(m)
    })

    // Fit bounds
    if (locations.length > 0) {
      const points: L.LatLngExpression[] = [
        ...locations.map(l => [l.lat, l.lng] as L.LatLngExpression),
        ...(midpoint ? [[midpoint.lat, midpoint.lng] as L.LatLngExpression] : []),
      ]
      map.fitBounds(L.latLngBounds(points).pad(0.25))
    }
  }, [locations, midpoint, routes, venues, onVenueClick])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  )
}