import mongoose from "mongoose"

// i need to know who did send the message, the name, email, phone number of the client
// i need to know if the clients are getting in contact to the owners, see if people really want to contact or not
// need to know the reason of why they are contact
// need to know the property id
// need to know the owner id

const contactSchema = new mongoose.Schema({
  propertyId: {
    type: String,
    ref: "RealState",
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  client: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    email: {
      type: String
    }
  },
  reason: {
    type: String
  },
  comment: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const contactModel = mongoose.model("contact-schema", contactSchema)
