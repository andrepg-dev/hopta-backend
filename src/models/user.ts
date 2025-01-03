import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
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
    phone: {
      type: String,
      required: true
    },
    reviews: {
      type: [String],
      required: false
    },
    properties: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'RealState',
      required: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  { versionKey: false }
)

export const userModel = mongoose.model('User', userSchema)
