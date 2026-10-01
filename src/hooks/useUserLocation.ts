import { useCallback, useEffect, useRef, useState } from 'react'

export type UserLocation = {
  lat: number
  lng: number
  accuracy: number
}

function readPosition(pos: GeolocationPosition): UserLocation {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy || 30,
  }
}

function friendlyGeoError(err: GeolocationPositionError | null, insecure: boolean) {
  if (insecure) {
    return 'GPS needs a secure page (localhost or HTTPS). Open the app via the Vite URL, not a file:// path.'
  }
  if (!err) return 'Unable to read GPS location.'
  if (err.code === err.PERMISSION_DENIED) {
    return 'Location permission denied. Allow location for this site, then tap ⌖ again.'
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return 'Location unavailable. Check that Location Services are on, then tap ⌖ again.'
  }
  if (err.code === err.TIMEOUT) {
    return 'GPS timed out. Move near a window or tap ⌖ to retry.'
  }
  return err.message || 'Unable to read GPS location.'
}

/** Watch device GPS, with explicit retry via requestLocation(). */
export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const watchIdRef = useRef<number | null>(null)

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const requestLocation = useCallback(() => {
    setRetryToken((n) => n + 1)
  }, [])

  useEffect(() => {
    const insecure =
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.protocol === 'file:'

    if (!navigator.geolocation) {
      setError('GPS is not available in this browser.')
      setLocating(false)
      return
    }

    if (insecure) {
      setError(friendlyGeoError(null, true))
      setLocating(false)
      return
    }

    setLocating(true)
    setError(null)
    clearWatch()

    const onSuccess = (pos: GeolocationPosition) => {
      setUserLocation(readPosition(pos))
      setError(null)
      setLocating(false)
    }

    const onError = (err: GeolocationPositionError) => {
      setLocating(false)
      setError(friendlyGeoError(err, false))
    }

    // Fast first fix
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    })

    // Keep updating as the user moves
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 25000,
    })

    return () => clearWatch()
  }, [retryToken, clearWatch])

  return { userLocation, error, locating, requestLocation }
}
