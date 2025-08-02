import { refreshTokenI } from '@/types/refresh-token/types'
import mongoose from 'mongoose'

const refreshToken = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    expires: '7d'
  },
  expires: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  }
})

export const refreshTokenModel = mongoose.model<refreshTokenI>('RefreshToken', refreshToken)
