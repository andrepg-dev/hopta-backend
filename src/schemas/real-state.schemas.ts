import { PROPERTY_TYPE } from "@/constants/real-state/property_type"
import { RealStateIWithOwner } from "@/types/real-state/types.real-state"
import { Request } from "express"
import mongoose, { model } from "mongoose"
import aggregatePaginate from "mongoose-aggregate-paginate-v2"
import mongoosePaginate from "mongoose-paginate-v2"
import { increaseVisit } from "../methods/realstate/increase-visit.method"
import { UserJWT } from "../middlewares/authMiddleware"

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
    property_type: {
      type: String,
      enum: PROPERTY_TYPE,
      required: true
    },
    one_month_upfront: {
      type: Boolean
    },
    isAccepted: {
      type: Boolean,
      default: false
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
      type: {
        type: String,
        default: "Point"
      },
      coordinates: {
        type: [Number, Number],
        index: "2dsphere"
      }
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
        type: [String]
      },
      exterior_extras: {
        type: [String]
      },
      community_extras: {
        type: [String]
      },
      security: {
        type: [String]
      }
    },
    additional_cost: {
      utilities_included: {
        type: [String]
      },
      water: {
        type: Number
      },
      electricity: {
        type: Number
      }
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
            type: mongoose.Schema.Types.Mixed,
            ref: "User",
            required: true
          },
          visit_date: [
            {
              type: Date,
              default: Date.now
            }
          ]
        }
      ],
      default: []
    },
    saved_by: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        saved_at: {
          type: Date,
          default: Date.now,
          immutable: true
        }
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
            ref: "User",
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
  {
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        if (ret && "visitors" in ret) {
          delete (ret as any).visitors
        }

        if (ret && "saved_by" in ret) {
          delete (ret as any).saved_by
        }
      }
    },
    toObject: {
      transform(doc, ret) {
        if (ret && "visitors" in ret) {
          delete (ret as any).visitors
        }

        if (ret && "saved_by" in ret) {
          delete (ret as any).saved_by
        }
      }
    }
  }
)

realStateSchema.pre("aggregate", function (this: mongoose.Aggregate<RealStateDocument[]>, next) {
  const options = this.options
  const userId = options?.user?.userId
  const pathname = options?.pathname
  const pipeline = this.pipeline()

  const hasGeoNear = pipeline.some((stage: any) => stage.$geoNear)

  if (hasGeoNear) {
    next()
    return
  }

  if (userId == "68c11a1ef3a5f54469f882ae") {
    next()
    return
  }

  // Show properties accepted
  if (userId && pathname == "/") {
    this.pipeline().unshift({
      $match: { isAccepted: true }
    })

    next()
    return
  }

  if (userId) {
    const id = new mongoose.Types.ObjectId(userId)
    this.pipeline().unshift({
      $match: {
        $or: [{ owner: id }, { isAccepted: true }]
      }
    })
    next()
    return
  }

  this.pipeline().unshift({
    $match: { isAccepted: true }
  })
  next()
})

realStateSchema.pre(/^find/, function (this: mongoose.Query<RealStateDocument[], RealStateDocument>, next) {
  const options = this.getOptions()
  let userId = options?.user?.userId
  const pathname = options?.pathname

  if (userId == "68c11a1ef3a5f54469f882ae") {
    next()
    return
  }

  // Show properties accepted
  if (userId && pathname == "/") {
    this.where({ isAccepted: true })
    next()
    return
  }

  if (userId) {
    const id = new mongoose.Types.ObjectId(userId)
    this.where({ $or: [{ owner: id }, { isAccepted: true }] })
    next()
    return
  }

  this.where({ isAccepted: true })
  next()
})

realStateSchema.pre("save", function (next) {
  // @ts-ignore
  this.updated_at = new Date()
  next()
})

realStateSchema.pre("updateOne", function (next) {
  // @ts-ignore
  this.updated_at = new Date()
  next()
})

realStateSchema.methods.increaseVisit = increaseVisit
realStateSchema.plugin(mongoosePaginate)
realStateSchema.plugin(aggregatePaginate)

interface RealStateDocument extends RealStateIWithOwner, mongoose.Document {
  /**
   * @description Increase the visits of one property based on the user ID or IP Address
   * @param params
   */
  increaseVisit(params: { decoded?: UserJWT | null; isVisit?: any; id?: string; req: Request<any> }): Promise<void>
}

export const RealStateModel = model<RealStateDocument, mongoose.PaginateModel<RealStateDocument> & mongoose.AggregatePaginateModel<RealStateDocument>>(
  "RealState",
  realStateSchema
)
