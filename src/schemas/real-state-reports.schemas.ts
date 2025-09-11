import mongoose, { model } from 'mongoose'

const realStateReportSchema = new mongoose.Schema({
  realStateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RealState',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  message: {
    type: String,
  },
  resolved: {
    type: Boolean,
    default: false
  }
})

const RealStateReport = model('RealStateReport', realStateReportSchema)

export default RealStateReport
