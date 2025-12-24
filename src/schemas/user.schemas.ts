import { UserI } from "@/types/login/user"
import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2"

// TODO: add if the user is married or not as optional
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: false
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    suscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subscription"
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
            ref: "User",
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
    favorites_properties: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "RealState"
    },
    profile_picture: {
      type: String,
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/i.test(v)
        },
        message: "Invalid URL format for profile picture"
      }
    },
    location: {
      title: { type: String },
      type: {
        type: String
      },
      coordinates: {
        type: [Number, Number],
        index: "2dsphere"
      }
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
          message: "Invalid Facebook URL"
        }
      },
      instagram: {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/(www\.)?instagram\.com\/.+/i.test(v)
          },
          message: "Invalid Instagram URL"
        }
      },
      twitter: {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^https?:\/\/(www\.)?twitter\.com\/.+/i.test(v)
          },
          message: "Invalid Twitter URL"
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
        university: {
          type: String
        },
        degree: {
          type: String
        },
        end_date: {
          type: Date
        }
      },
      description: {
        type: String
      }
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
    }
  },
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        delete ret.auth
        return ret
      },
      virtuals: true
    },
    toObject: {
      transform(doc, ret) {
        delete ret.auth
        return ret
      },
      virtuals: true
    },
    id: false
  }
)

userSchema.virtual("properties", {
  ref: "RealState",
  localField: "_id",
  foreignField: "owner"
})

// Middleware para actualizar `updated_at` automáticamente antes de guardar
userSchema.pre("save", function (next) {
  this.updated_at = new Date()
  next()
})

userSchema.plugin(mongoosePaginate)

export interface UserDocument extends mongoose.Document, UserI {}

export const userModel = mongoose.model<UserDocument, mongoose.PaginateModel<UserDocument>>("User", userSchema)
