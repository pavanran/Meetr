import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Room } from '@/types'

export function useRoom(id: string) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRoom() {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        setError('Room not found')
      } else {
        setRoom(data)
      }
      setLoading(false)
    }
    fetchRoom()
  }, [id])

  return { room, loading, error }
}

export async function createRoom(name: string): Promise<Room | null> {
  // Generate a readable room ID e.g. "happy-panda-4821"
  const words = ['happy','swift','brave','calm','cool','warm','bold','kind']
  const animals = ['panda','tiger','fox','wolf','bear','eagle','shark','hawk']
  const word = words[Math.floor(Math.random() * words.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const num = Math.floor(Math.random() * 9000) + 1000
  const id = `${word}-${animal}-${num}`

  const { data, error } = await supabase
    .from('rooms')
    .insert({ id, name })
    .select()
    .single()

  if (error) { console.error(error); return null }
  return data
}