import mongoose from 'mongoose'

const suscribeSchema = new mongoose.Schema({
  email: {
    type: String
  },
  phone: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const suscribeModel = mongoose.model('Suscribe', suscribeSchema)

export default suscribeModel