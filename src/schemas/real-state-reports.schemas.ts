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
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  message: {
    type: String,
  }
})

const RealStateReport = model('RealStateReport', realStateReportSchema)

export default RealStateReport
