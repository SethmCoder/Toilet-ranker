export type Bathroom = {
  id: string
  user_id: string | null
  toilet_rating: number
  sink_rating: number
  floor_rating: number
  overall_rating: number
  notes: string
  location_name: string
  latitude: number
  longitude: number
  created_at: string
}

export type RatingForm = {
  toilet: number
  sink: number
  floor: number
  notes: string
  locationName: string
  latitude: number | null
  longitude: number | null
}

export type ThemeMode = 'light' | 'dark'

export type Customization = {
  hue: number
  brightness: number
  buttonOmbre: boolean
  appOmbre: boolean
  lightingOmbre: boolean
}

export type FilterState = {
  minRating: number
  maxRating: number
  query: string
}
