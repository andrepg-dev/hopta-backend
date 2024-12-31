import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
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
  }
})

export const userModel = mongoose.model('User', userSchema)
