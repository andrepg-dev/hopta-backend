import mongoose from 'mongoose'

interface Contact {
  phone_number?: string
  is_phone_number_verified?: boolean
  email_contact?: string
}

export interface Review {
  user: mongoose.Types.ObjectId
  review: string
  rating: number
}

export interface SocialMedia {
  facebook?: string
  instagram?: string
  twitter?: string
}

export interface UserI {
  name: string
  last_name: string
  contact: Contact
  email: string
  password: string
  reviews: Review[]
  properties?: mongoose.Types.ObjectId[]
  favorites_properties?: mongoose.Types.ObjectId[]
  is_verified: boolean
  profile_picture?: string
  location?: string[]
  created_at: Date
  social_media: SocialMedia
  identity_number?: string
}

export interface CreateUserI extends Omit<UserI, 'created_at' | 'reviews' | ''> {}