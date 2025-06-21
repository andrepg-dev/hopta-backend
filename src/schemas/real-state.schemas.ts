import Logs from '@/src/services/logs/save-logs.service'
import { RealStateI, RealStateIWithOwner } from '@/types/real-state/types.real-state'
import mongoose, { model } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const realStateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    images: {
      type: [String],
      required: true
    },
    location: {
      title: {
        type: String,
        required: true
      },
      coordinates: {
        lat: {
          type: Number,
          required: true
        },
        lng: {
          type: Number,
          required: true
        }
      },
    },
    square_meters: {
      type: Number
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    population: {
      type: Number
    },
    house_features: {
      rooms: {
        type: Number,
        required: true
      },
      bathrooms: {
        type: Number,
        required: true
      },
      interior_extras: {
        type: [String],
        enum: ['water_tank', 'water_cistern', 'closets', 'furnished', 'air_conditioning', '24_7_security', 'garage', 'allowPets']
      },
      exterior_extras: {
        type: [String],
        enum: ['balcony', 'patio', 'terrace', 'garden', 'swimming_pool']
      },
      community_extras: {
        type: [String],
        enum: ['gym', 'parks', 'schools', 'shopping_malls', 'supermarkets', 'elevator']
      },
      security: {
        type: [String],
        enum: ['gated_community']
      }
    },
    additional_cost: {
      utilities_included: {
        type: [String],
        enum: ['water', 'electricity', 'internet']
      }
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
    },
    house_status: {
      is_available: {
        type: Boolean,
        default: true
      },
      is_sold: {
        type: Boolean,
        default: false
      },
      sold_date: {
        type: Date
      }
    },
    visitors: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            immutable: true
          },
          visit_date: {
            type: Date,
            default: Date.now
          },
          comments: {
            type: String
          }
        }
      ],
      default: []
    },
    saved_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
      }
    ],
    stats: {
      total_visits: {
        type: Number,
        default: 0
      },
      total_saves: {
        type: Number,
        default: 0
      }
    },
    ratings: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            immutable: true
          },
          rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
          },
          comment: {
            type: String
          },
          created_at: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    },
    rating_summary: {
      average_rating: {
        type: Number,
        default: 0
      },
      total_ratings: {
        type: Number,
        default: 0
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
    }
  },
  { versionKey: false }
)

realStateSchema.pre('save', function (next) {
  this.updated_at = new Date()
  next()
})

realStateSchema.post('save', async function (doc: RealStateIWithOwner) {
  new Logs({
    method: 'saveLogs',
    message: `New property created: ${doc.title} at (${doc.location.coordinates.lat}, ${doc.location.coordinates.lng})`
  })
})

realStateSchema.plugin(mongoosePaginate)

interface RealStateDocument extends mongoose.Document, RealStateI { }

export const RealStateModel = model<RealStateDocument, mongoose.PaginateModel<RealStateDocument>>('RealState', realStateSchema)
