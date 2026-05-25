import asyncHandler from "@/src/actions/try-catch-async-handler"
import { AppError } from "@/src/handlers/error-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { authMiddleware } from "@/src/middlewares/authMiddleware"
import { validateRequest } from "@/src/middlewares/validate-request"
import { MessageConversationModel } from "@/src/schemas/message-conversation.schemas"
import { MessageModel } from "@/src/schemas/message.schemas"
import { emitMessageEvents } from "@/src/services/socket/socket.service"
import { sendMessageSchema } from "@/src/zod/message.zod"
import { Request, Response, Router } from "express"
import mongoose from "mongoose"

const messagesRouter = Router()

messagesRouter.use(authMiddleware)

messagesRouter.get(
  "/conversations",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId
    if (!userId) throw new AppError("Unauthorized", 401)

    const conversations = await MessageConversationModel.find({
      participants: userId
    })
      .populate({
        path: "participants",
        select: "_id name last_name email profile_picture contact.phone_number"
      })
      .populate({
        path: "propertyId",
        select: "title images location price currency"
      })
      .populate({
        path: "lastMessage",
        select: "body sender senderType senderSnapshot readBy createdAt"
      })
      .sort({ lastMessageAt: -1 })

    responseHandler({ res, code: 200, data: conversations })
  })
)

messagesRouter.get(
  "/conversations/:conversationId",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId
    const rawConversationId = req.params.conversationId
    const conversationId = Array.isArray(rawConversationId) ? rawConversationId[0] : rawConversationId
    if (!userId) throw new AppError("Unauthorized", 401)

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      throw new AppError("Invalid conversation id", 400)
    }

    const conversation = await MessageConversationModel.findOne({
      _id: conversationId,
      participants: userId
    })

    if (!conversation) throw new AppError("Conversation not found", 404)

    const messages = await MessageModel.find({ conversationId })
      .populate({
        path: "sender",
        select: "_id name last_name email profile_picture"
      })
      .sort({ createdAt: 1 })

    await MessageModel.updateMany(
      {
        conversationId,
        sender: { $ne: userId },
        readBy: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    )

    responseHandler({ res, code: 200, data: messages })
  })
)

messagesRouter.post(
  "/",
  validateRequest(sendMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId
    const { conversationId, body } = req.body
    if (!userId) throw new AppError("Unauthorized", 401)

    const conversation = await MessageConversationModel.findOne({
      _id: conversationId,
      participants: userId
    })

    if (!conversation) throw new AppError("Conversation not found", 404)

    const message = await MessageModel.create({
      conversationId,
      sender: userId,
      senderType: "user",
      body,
      readBy: [userId]
    })

    conversation.lastMessage = message._id
    conversation.lastMessageAt = message.createdAt
    await conversation.save()

    const populatedMessage = await MessageModel.findById(message._id).populate({
      path: "sender",
      select: "_id name last_name email profile_picture"
    })

    await emitMessageEvents({
      conversationId: conversation._id.toString(),
      messageId: message._id.toString()
    })

    responseHandler({
      res,
      code: 201,
      data: populatedMessage,
      message: "Message sent successfully"
    })
  })
)

export default messagesRouter
