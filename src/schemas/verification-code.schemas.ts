import mongoose from 'mongoose'

const verificationCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  userData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  expires: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  },
  created_at: {
    type: Date,
    default: Date.now
  }
})

// Índice TTL para eliminar documentos expirados
verificationCodeSchema.index({ expires: 1 }, { expireAfterSeconds: 0 })

export const verificationCodeModel = mongoose.model('VerificationCode', verificationCodeSchema)
