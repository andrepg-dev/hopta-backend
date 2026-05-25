import mongoose from "mongoose"

const messageConversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        }
      ],
      required: true,
      validate: {
        validator: (value: mongoose.Types.ObjectId[]) => value.length >= 1,
        message: "A conversation needs at least one participant"
      }
    },
    client: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      name: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true
      }
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    propertyId: {
      type: String,
      ref: "RealState",
      required: true
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message"
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

messageConversationSchema.index({ participants: 1, lastMessageAt: -1 })
messageConversationSchema.index({ propertyId: 1, ownerId: 1, "client.userId": 1 })
messageConversationSchema.index({ propertyId: 1, ownerId: 1, "client.email": 1, "client.phone": 1 })

export const MessageConversationModel = mongoose.model(
  "message-conversation",
  messageConversationSchema
)
