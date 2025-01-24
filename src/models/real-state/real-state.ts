import { EmailService } from '@/src/modules/email/email.service'
import Logs from '@/src/modules/logs/save-logs.service'
import { RealStateI, RealStateIWithOwner } from '@/types/real-state/type'
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
          required: false
        },
        water_cistern: {
          type: Boolean,
          required: false
        },
        closets: {
          type: Boolean,
          required: false
        },
        furnished: {
          type: Boolean,
          required: false
        },
        air_conditioning: {
          type: Boolean,
          required: false
        },
        '24_7_security': {
          type: Boolean,
          required: false
        },
        garage: {
          type: Boolean,
          required: false
        }
      },
      extras_from_outside: {
        balcony: {
          type: Boolean,
          required: false
        },
        patio: {
          type: Boolean,
          required: false
        },
        terrace: {
          type: Boolean,
          required: false
        },
        garden: {
          type: Boolean,
          required: false
        },
        swimming_pool: {
          type: Boolean,
          required: false
        }
      },
      community_extras: {
        gym: {
          type: Boolean,
          required: false
        },
        parks: {
          type: Boolean,
          required: false
        },
        schools: {
          type: Boolean,
          required: false
        },
        shopping_malls: {
          type: Boolean,
          required: false
        },
        supermarkets: {
          type: Boolean,
          required: false
        },
        elevator: {
          type: Boolean,
          required: false
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
      default: Date.now,
      required: true,
      immutable: true
    },
    updated_at: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  { versionKey: false }
)

// Save in the log and send an email to the administrator when a new property is created

realStateSchema.post('save', async function (doc: RealStateIWithOwner) {
  const emailService = new EmailService()

  emailService.sendEmail({
    to: 'andreponce417@gmail.com',
    subject: `New property created`,
    html: `<h1>${doc.title} by ${doc.owner}</h1> <pre>${JSON.stringify(doc, null, 2)}</pre>`
  })

  const logger = new Logs()
  logger.saveLogs().info(`New property created: ${doc.title} at ${doc.location}`)
})

realStateSchema.plugin(mongoosePaginate)

interface RealStateDocument extends mongoose.Document, RealStateI {}

export const RealStateModel = model<RealStateDocument, mongoose.PaginateModel<RealStateDocument>>('RealState', realStateSchema)
