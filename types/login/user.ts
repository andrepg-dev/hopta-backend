import mongoose from "mongoose"

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

interface Auth {
  local?: {
    password?: string
  }
  google?: {
    id?: string
  }
  facebook?: {
    id?: string
  }
  sms?: {
    phoneNumber?: string
    verified?: boolean
  }
}

interface PersonalInformation {
  identity_document: string
  email_verified: boolean
  phone_number_verified: boolean
  birth_date?: string
}

interface About {
  work_experience?: string
  education?: {
    university?: string
    degree?: string
    end_date?: string
  }
  description?: string
}

export interface UserI {
  name: string
  last_name?: string
  last_seen?: Date
  contact?: Contact
  email: string
  auth?: Auth
  reviews?: Review[]
  properties?: mongoose.Types.ObjectId[]
  favorites_properties?: mongoose.Types.ObjectId[]
  profile_picture?: string
  location?: {
    type: "Point"
    title: string
    coordinates: [number, number]
  }
  readonly created_at: Date
  readonly updated_at: Date
  social_media?: SocialMedia
  personal_information?: PersonalInformation
  about?: About
  suscription?: mongoose.Types.ObjectId
  role?: "admin" | "user"
}

export interface CreateUserI extends Omit<UserI, "created_at" | "reviews" | "auth"> {
  email: string
  password: string
}
