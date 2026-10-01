import { useCallback, useEffect, useState } from 'react'
import type { Bathroom, RatingForm } from '../types'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const LOCAL_KEY = 'bathroom-ranker-local-ratings'

function readLocal(): Bathroom[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as Bathroom[]) : []
  } catch {
    return []
  }
}

function writeLocal(items: Bathroom[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

export function useBathrooms() {
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!isSupabaseConfigured) {
      setBathrooms(readLocal())
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('bathrooms')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setBathrooms(readLocal())
    } else {
      setBathrooms((data as Bathroom[]) ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const submitRating = useCallback(
    async (form: RatingForm, userId: string | null) => {
      if (form.latitude == null || form.longitude == null) {
        return 'Click the map to set the bathroom location.'
      }
      if (!form.locationName.trim()) {
        return 'Enter a location name.'
      }

      const overall =
        Math.round(((form.toilet + form.sink + form.floor) / 3) * 10) / 10

      const payload = {
        user_id: userId,
        toilet_rating: form.toilet,
        sink_rating: form.sink,
        floor_rating: form.floor,
        overall_rating: overall,
        notes: form.notes.trim(),
        location_name: form.locationName.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
      }

      if (!isSupabaseConfigured) {
        const localItem: Bathroom = {
          id: crypto.randomUUID(),
          ...payload,
          created_at: new Date().toISOString(),
        }
        const next = [localItem, ...readLocal()]
        writeLocal(next)
        setBathrooms(next)
        return null
      }

      const { data, error: insertError } = await supabase
        .from('bathrooms')
        .insert(payload)
        .select()
        .single()

      if (insertError) return insertError.message

      setBathrooms((prev) => [data as Bathroom, ...prev])
      return null
    },
    [],
  )

  const deleteRating = useCallback(async (id: string, userId: string | null) => {
    if (!userId) return 'Log in to delete your posts.'

    if (!isSupabaseConfigured) {
      const next = readLocal().filter((b) => b.id !== id)
      writeLocal(next)
      setBathrooms(next)
      return null
    }

    const { error: deleteError } = await supabase
      .from('bathrooms')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) return deleteError.message

    setBathrooms((prev) => prev.filter((b) => b.id !== id))
    return null
  }, [])

  return { bathrooms, loading, error, refresh, submitRating, deleteRating }
}
