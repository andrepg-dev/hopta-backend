import { Types } from 'mongoose'

export type InteriorExtrasType = 'water_tank' | 'water_cistern' | 'closets' | 'furnished' | 'air_conditioning' | '24_7_security' | 'garage' | 'allowPets'
export type ExteriorExtrasType = 'balcony' | 'patio' | 'terrace' | 'garden' | 'swimming_pool'
export type CommunityExtrasType = 'gym' | 'parks' | 'schools' | 'shopping_malls' | 'supermarkets' | 'elevator'
export type SecurityType = 'gated_community'

export interface InteriorExtras {
  [key: string]: InteriorExtrasType[]
}

export interface ExteriorExtras {
  [key: string]: ExteriorExtrasType[]
}

export interface CommunityExtras {
  [key: string]: CommunityExtrasType[]
}

export interface Security {
  [key: string]: SecurityType[]
}

export interface HouseFeatures {
  rooms: number
  bathrooms: number
  interior_extras?: InteriorExtras
  exterior_extras?: ExteriorExtras
  community_extras?: CommunityExtras
  security?: Security
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

export interface AdditionalCost {
  utilities_included: 'water' | 'electricity' | 'internet'
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
  additional_cost?: AdditionalCost
  created_at?: Date
  updated_at?: Date
}

export interface RealStateIWithOwner extends RealStateI {
  owner: Types.ObjectId
}
