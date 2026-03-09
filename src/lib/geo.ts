import type { Location } from '@/types'

export function centroid(locations: Location[]): { lat: number; lng: number } {
  const lat = locations.reduce((a, l) => a + l.lat, 0) / locations.length
  const lng = locations.reduce((a, l) => a + l.lng, 0) / locations.length
  return { lat, lng }
}

export function haversine(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function fmtTime(secs: number): string {
  if (secs < 60) return '<1 min'
  const m = Math.round(secs / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

export const COLORS = [
  '#3b6fd4', '#e53e3e', '#38a169',
  '#d69e2e', '#805ad5', '#dd6b20'
]