import { Types } from "mongoose"

export type InteriorExtrasType = "water_tank" | "water_cistern" | "closets" | "furnished" | "air_conditioning" | "garage" | "allowPets" | "parking"
export type ExteriorExtrasType = "balcony" | "patio" | "terrace" | "garden" | "swimming_pool"
export type CommunityExtrasType = "gym" | "parks" | "schools" | "shopping_malls" | "supermarkets" | "elevator"
export type SecurityType = "gated_community" | "24_7_security" | "security_guard"
export type UtilitiesType = "water" | "electricity" | "internet"

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

export interface Utilities {
  [key: string]: UtilitiesType[]
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
  title: string
  type: string
  coordinates: [number, number]
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
  utilities_included?: UtilitiesType[]
  water?: number
  electricity?: number
}

export interface RealStateI {
  title: string
  description: string
  images: string[]
  property_id: [String]
  property_type: "rent_house" | "rent_premises" | "land" | "sell_house"
  one_month_upfront: boolean
  isAccepted: boolean
  location: Location
  square_varas?: number
  square_meters?: number
  price: number
  currency: "HNL" | "USD" | "EUR"
  population?: number
  house_features: HouseFeatures
  house_status?: HouseStatus
  visitors?: Visitor[]
  saved_by?: [
    {
      user: string
      saved_at: Date
    }
  ]
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
