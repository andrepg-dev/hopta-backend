import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message-conversation",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    senderType: {
      type: String,
      enum: ["user", "contact"],
      default: "user"
    },
    senderSnapshot: {
      name: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      }
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    readBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

export const MessageModel = mongoose.model("message", messageSchema)
