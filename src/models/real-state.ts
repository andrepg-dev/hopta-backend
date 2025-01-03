import mongoose, { model } from 'mongoose'

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
    price: {
      type: Number,
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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    created: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
)

export const RealStateModel = model('RealState', realStateSchema)
