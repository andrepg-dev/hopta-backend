import mongoose from 'mongoose'

const pendingSmsUserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 hour
  }
})

export const pedingUserModel = mongoose.model('pending-sms-user', pendingSmsUserSchema)
