import { EmailService } from '@/src/modules/email/email.service'
import Logs from '@/src/modules/logs/save-logs.service'
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
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    square_meters: {
      type: Number,
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
      kitchens: {
        type: Number
      },
      interior_extras: {
        water_tank: Boolean,
        water_cistern: Boolean,
        closets: Boolean,
        furnished: Boolean,
        air_conditioning: Boolean,
        '24_7_security': Boolean,
        garage: Boolean
      },
      exterior_extras: {
        balcony: Boolean,
        patio: Boolean,
        terrace: Boolean,
        garden: Boolean,
        swimming_pool: Boolean
      },
      community_extras: {
        gym: Boolean,
        parks: Boolean,
        schools: Boolean,
        shopping_malls: Boolean,
        supermarkets: Boolean,
        elevator: Boolean
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
      type: [{
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
      }],
      default: []
    },
    saved_by: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true
    }],
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
      type: [{
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
      }],
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
  const emailService = new EmailService()

  await emailService.sendEmail({
    to: 'andreponce417@gmail.com',
    subject: `New property created`,
    html: `<h1>${doc.title} by ${doc.owner}</h1> <pre>${JSON.stringify(doc, null, 2)}</pre>`
  })

  const logger = new Logs()
  logger.saveLogs().info(
    `New property created: ${doc.title} at (${doc.location.lat}, ${doc.location.lng})`
  )
})

realStateSchema.plugin(mongoosePaginate)

interface RealStateDocument extends mongoose.Document, RealStateI { }

export const RealStateModel = model<RealStateDocument, mongoose.PaginateModel<RealStateDocument>>(
  'RealState',
  realStateSchema
)
