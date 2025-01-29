import mongoose from 'mongoose'

export interface RealStateI {
  title: string
  description: string
  images: string[]
  location: {
    lat: number
    lng: number
  }
  square_meters: number
  price: number
  currency?: string
  population?: number
  house_features: {
    rooms: number
    bathrooms: number
    kitchens?: number
    interior_extras?: {
      water_tank?: boolean
      water_cistern?: boolean
      closets?: boolean
      furnished?: boolean
      air_conditioning?: boolean
      '24_7_security'?: boolean
      garage?: boolean
    }
    exterior_extras?: {
      balcony?: boolean
      patio?: boolean
      terrace?: boolean
      garden?: boolean
      swimming_pool?: boolean
    }
    community_extras?: {
      gym?: boolean
      parks?: boolean
      schools?: boolean
      shopping_malls?: boolean
      supermarkets?: boolean
      elevator?: boolean
    }
  }
  house_status: {
    is_available: boolean
    is_sold: boolean
    sold_date?: Date
  }
}

export interface RealStateIWithOwner extends RealStateI {
  owner: mongoose.Types.ObjectId
  created_at: Date
}
