import type { TravelMode, RouteResult } from '@/types'

const OSRM_PROFILE: Record<TravelMode, string> = {
  'foot-walking':    'foot',
  'cycling-regular': 'bike',
  'driving-car':     'car',
  'transit':         'foot', // fallback — no free transit routing API
}

export async function getRoute(
  fromLat: number, fromLng: number,
  toLat: number,   toLng: number,
  mode: TravelMode
): Promise<RouteResult | null> {
  const profile = OSRM_PROFILE[mode]
  const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.routes?.[0]) {
      return {
        coords: data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        ),
        duration: data.routes[0].duration,
      }
    }
  } catch {}
  return null
}