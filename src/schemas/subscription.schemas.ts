import { SubscriptionI } from '@/types/subscription/types.subscription'
import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    features: {
      type: [String],
      required: true
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
)

subscriptionSchema.pre('save', function (next) {
  this.updated_at = new Date()
  next()
})

interface SubscriptionDocument extends mongoose.Document, SubscriptionI {}
export const subscriptionModel = mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema)
