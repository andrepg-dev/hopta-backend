import mongoose from 'mongoose'
import z from 'zod'

export const ObjectIdSchema = z.custom<mongoose.Types.ObjectId>(
  (val) => {
    return mongoose.Types.ObjectId.isValid(val)
  },
  { message: 'Invalid MongoDB ObjectId' }
)
