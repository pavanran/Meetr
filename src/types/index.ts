export type TravelMode =
  | 'foot-walking'
  | 'cycling-regular'
  | 'driving-car'
  | 'transit'

export interface Room {
  id: string
  name: string
  created_at: string
  expires_at: string
}

export interface Location {
  id: string
  room_id: string
  name: string        // person's nickname e.g. "Pavan"
  place_name: string  // e.g. "Brixton, London"
  lat: number
  lng: number
  mode: TravelMode
  color: string
  travel_time: string | null
  created_at: string
}

export interface Venue {
  id: number
  lat: number
  lon: number
  emoji: string
  label: string
  tags: {
    name?: string
    amenity?: string
    leisure?: string
    opening_hours?: string
  }
}

export interface RouteResult {
  coords: [number, number][]
  duration: number // seconds
}