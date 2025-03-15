import { UserI } from '@/types/login/user'
import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

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
    email: {
      type: String,
      unique: true
    },
    suscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'subscription'
    },
    auth: {
      local: {
        password: {
          type: String
        }
      },
      google: {
        id: { type: String, unique: true, sparse: true }
      },
      facebook: {
        id: { type: String, unique: true, sparse: true }
      },
      sms: {
        phoneNumber: { type: String, unique: true, sparse: true },
        verified: { type: Boolean, default: false }
      }
    },
    contact: {
      phone_number: {
        type: String
      },
      is_phone_number_verified: {
        type: Boolean,
        default: false
      }
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
      ref: 'RealState'
    },
    favorites_properties: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'RealState'
    },
    profile_picture: {
      type: String,
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/i.test(v)
        },
        message: 'Invalid URL format for profile picture'
      }
    },
    location: {
      type: [
        {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true }
        }
      ]
    },
    created_at: {
      type: Date,
      default: Date.now,
      immutable: true
    },
    updated_at: {
      type: Date,
      default: Date.now
    },
    social_media: {
      facebook: {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/(www\.)?facebook\.com\/.+/i.test(v)
          },
          message: 'Invalid Facebook URL'
        }
      },
      instagram: {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/(www\.)?instagram\.com\/.+/i.test(v)
          },
          message: 'Invalid Instagram URL'
        }
      },
      twitter: {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/(www\.)?twitter\.com\/.+/i.test(v)
          },
          message: 'Invalid Twitter URL'
        }
      }
    },
    personal_information: {
      identity_document: {
        type: String
      },
      email_verified: {
        type: Boolean
      },
      phone_number_verified: {
        type: Boolean
      }
    },
    about: {
      work_experience: {
        type: String
      },
      education: {
        type: String
      },
      description: {
        type: String
      },
      certifications: {
        type: [String]
      },
      languages: {
        type: [String]
      },
      favorite_song: {
        type: String
      },
      where_im_living: {
        type: String
      }
    }
  },
  { versionKey: false }
)

// Middleware para actualizar `updated_at` automáticamente antes de guardar
userSchema.pre('save', function (next) {
  this.updated_at = new Date()
  next()
})

userSchema.plugin(mongoosePaginate)

interface UserDocument extends mongoose.Document, UserI {}

export const userModel = mongoose.model<UserDocument, mongoose.PaginateModel<UserDocument>>('User', userSchema)
