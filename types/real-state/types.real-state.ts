import { Types } from 'mongoose'

export interface InteriorExtras {
  water_tank?: boolean
  water_cistern?: boolean
  closets?: boolean
  furnished?: boolean
  air_conditioning?: boolean
  '24_7_security'?: boolean
  garage?: boolean
}

export interface ExteriorExtras {
  balcony?: boolean
  patio?: boolean
  terrace?: boolean
  garden?: boolean
  swimming_pool?: boolean
}

export interface CommunityExtras {
  gym?: boolean
  parks?: boolean
  schools?: boolean
  shopping_malls?: boolean
  supermarkets?: boolean
  elevator?: boolean
}

export interface HouseFeatures {
  rooms: number
  bathrooms: number
  kitchens?: number
  interior_extras?: InteriorExtras
  exterior_extras?: ExteriorExtras
  community_extras?: CommunityExtras
}

export interface Location {
  lat: number
  lng: number
}

export interface HouseStatus {
  is_available?: boolean
  is_sold?: boolean
  sold_date?: Date | string
}

export interface Visitor {
  user: string | Types.ObjectId
  visit_date?: Date
  comments?: string
}

export interface Stats {
  total_visits: number
  total_saves: number
}

export interface Rating {
  user: string | Types.ObjectId
  rating: number
  comment?: string
  created_at?: Date
}

export interface RatingSummary {
  average_rating: number
  total_ratings: number
}

export interface RealStateI {
  title: string
  description: string
  images: string[]
  location: Location
  square_meters?: number
  price: number
  currency: 'HNL' | 'USD' | 'EUR'
  population?: number
  house_features: HouseFeatures
  house_status?: HouseStatus
  visitors?: Visitor[]
  saved_by?: (string | Types.ObjectId)[]
  stats?: Stats
  ratings?: Rating[]
  rating_summary?: RatingSummary
  created_at?: Date
  updated_at?: Date
}

export interface RealStateIWithOwner extends RealStateI {
  owner: Types.ObjectId
}

