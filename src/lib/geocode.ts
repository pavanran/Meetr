export interface GeoResult {
  lat: number
  lng: number
  displayName: string
  shortName: string
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export async function search(query: string, proximity?: [number, number]): Promise<GeoResult[]> {
  const prox = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : ''
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&limit=5&language=en${prox}`
  )
  const data = await res.json()
  return (data.features ?? []).map((f: any) => ({
    lat: f.center[1],
    lng: f.center[0],
    displayName: f.place_name,
    shortName: f.text,
  }))
}

export async function reverse(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&limit=1&language=en`
  )
  const data = await res.json()
  const f = data.features?.[0]
  if (!f) return 'Unknown area'
  // Pick neighbourhood or locality context
  const ctx = f.context ?? []
  const neighbourhood = ctx.find((c: any) => c.id.startsWith('neighborhood') || c.id.startsWith('locality'))
  return neighbourhood?.text ?? f.text ?? 'Unknown area'
}