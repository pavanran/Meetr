import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/lib/geo'
import type { Location, TravelMode } from '@/types'

export function useLocations(roomId: string) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)

  // Initial fetch
  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      setLocations(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [roomId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'locations', filter: `room_id=eq.${roomId}` },
        payload => {
          setLocations(prev => {
            if (prev.find(l => l.id === payload.new.id)) return prev
            return [...prev, payload.new as Location]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'locations', filter: `room_id=eq.${roomId}` },
        payload => {
          setLocations(prev => prev.filter(l => l.id !== payload.old.id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'locations', filter: `room_id=eq.${roomId}` },
        payload => {
          setLocations(prev =>
            prev.map(l => l.id === payload.new.id ? payload.new as Location : l)
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  const addLocation = useCallback(async (
    name: string,
    placeName: string,
    lat: number,
    lng: number,
    mode: TravelMode
  ) => {
    const color = COLORS[locations.length % COLORS.length]
    const { error } = await supabase.from('locations').insert({
      room_id: roomId,
      name,
      place_name: placeName,
      lat,
      lng,
      mode,
      color,
    })
    if (error) console.error(error)
  }, [roomId, locations.length])

  const removeLocation = useCallback(async (id: string) => {
    const { error } = await supabase.from('locations').delete().eq('id', id)
    if (error) console.error(error)
  }, [])

  const updateTravelTime = useCallback(async (id: string, travelTime: string) => {
    const { error } = await supabase
      .from('locations')
      .update({ travel_time: travelTime })
      .eq('id', id)
    if (error) console.error(error)
  }, [])

  const clearAll = useCallback(async () => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('room_id', roomId)
    if (error) console.error(error)
  }, [roomId])

  return { locations, loading, addLocation, removeLocation, updateTravelTime, clearAll }
}