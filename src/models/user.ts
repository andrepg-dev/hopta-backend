import { profile } from 'console'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    contact: {
      phone_number: {
        type: String,
        required: false
      },
      is_phone_number_verified: {
        type: Boolean,
        required: false
      },
      email_contact: {
        type: String,
        required: false,
        unique: false
      }
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      unique: false
    },
    reviews: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
          },
          review: {
            type: String,
            required: true
          },
          rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
          }
        }
      ],
      default: []
    },
    properties: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'RealState',
      required: false
    },
    favorites_properties: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'RealState',
      required: false
    },
    is_verified: {
      type: Boolean,
      default: false,
      required: true
    },
    profile_picture: {
      type: String,
      required: false
    },
    location: {
      type: Array<String>, // Estas son todas las ubicaciones del usuario
      required: false
    },
    created_at: {
      type: Date,
      default: Date.now,
      required: true
    },
    social_media: {
      facebook: {
        type: String,
        required: false
      },
      instagram: {
        type: String,
        required: false
      },
      twitter: {
        type: String,
        required: false
      }
    },
    identity_number: {
      type: String,
      required: false
    }
  },
  { versionKey: false }
)

export const userModel = mongoose.model('User', userSchema)
