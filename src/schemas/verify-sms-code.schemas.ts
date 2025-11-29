import mongoose from "mongoose"

const verificationSMSCodeSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },
  code: {
    type: String,
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

verificationSMSCodeSchema.index({ expires: 1 }, { expireAfterSeconds: 0 })

export const verificationSMSCodeModel = mongoose.model("VerificationSMSCode", verificationSMSCodeSchema)
