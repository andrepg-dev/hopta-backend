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
      type: String,
      required: true
    },
    square_meters: {
      type: String,
      required: false
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
      type: Number,
      required: false
    },
    house_feautures: {
      rooms: {
        type: Number,
        required: true
      },
      bathrooms: {
        type: Number,
        required: true
      },
      kitchens: {
        type: Number,
        required: false
      },
      interior_extras: {
        water_tank: {
          type: Boolean,
          default: false
        },
        water_cistern: {
          type: Boolean,
          default: false
        },
        closets: {
          type: Boolean,
          default: false
        },
        furnished: {
          type: Boolean,
          default: false
        },
        air_conditioning: {
          type: Boolean,
          default: false
        },
        '24_7_security': {
          type: Boolean,
          default: false
        },
        garage: {
          type: Boolean,
          default: false
        }
      },
      extras_from_outside: {
        balcony: {
          type: Boolean,
          default: false
        },
        patio: {
          type: Boolean,
          default: false
        },
        terrace: {
          type: Boolean,
          default: false
        },
        garden: {
          type: Boolean,
          default: false
        },
        swimming_pool: {
          type: Boolean,
          default: false
        }
      },
      community_extras: {
        gym: {
          type: Boolean,
          default: false
        },
        parks: {
          type: Boolean,
          default: false
        },
        schools: {
          type: Boolean,
          default: false
        },
        shopping_malls: {
          type: Boolean,
          default: false
        },
        supermarkets: {
          type: Boolean,
          default: false
        },
        elevator: {
          type: Boolean,
          default: false
        }
      }
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    house_status: {
      is_available: {
        type: Boolean,
        default: true,
        required: true
      },
      is_sold: {
        type: Boolean,
        default: false,
        required: true
      },
      sold_date: {
        type: Date,
        required: false
      }
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
)

realStateSchema.plugin(mongoosePaginate)

interface RealStateDocument extends mongoose.Document {}

export const RealStateModel = model<RealStateDocument, mongoose.PaginateModel<RealStateDocument>>(
  'RealState',
  realStateSchema,
  'real-state'
)
