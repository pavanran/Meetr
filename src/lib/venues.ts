import type { Venue } from '@/types'

const VENUE_TYPES = [
  { tag: 'amenity=restaurant', emoji: '🍽️', label: 'restaurant' },
  { tag: 'amenity=cafe',       emoji: '☕',  label: 'cafe' },
  { tag: 'amenity=bar',        emoji: '🍺',  label: 'bar' },
  { tag: 'leisure=park',       emoji: '🌳',  label: 'park' },
  { tag: 'amenity=cinema',     emoji: '🎬',  label: 'cinema' },
  { tag: 'amenity=pub',        emoji: '🍻',  label: 'pub' },
  { tag: 'amenity=fast_food',  emoji: '🍔',  label: 'fast food' },
  { tag: 'amenity=library',    emoji: '📚',  label: 'library' },
]

export async function fetchVenues(
  lat: number, lng: number, radius = 1000
): Promise<Venue[]> {
  const union = VENUE_TYPES
    .map(v => `node[${v.tag}](around:${radius},${lat},${lng});`)
    .join('')
  const query = `[out:json][timeout:10];(${union});out 30;`

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })
  const data = await res.json()

  return (data.elements as any[])
    .filter(el => el.tags?.name)
    .map(el => {
      const match = VENUE_TYPES.find(vt => {
        const [k, val] = vt.tag.split('=')
        return el.tags?.[k] === val
      })
      return {
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        emoji: match?.emoji ?? '📍',
        label: match?.label ?? 'place',
        tags: el.tags,
      }
    })
    .slice(0, 12)
}