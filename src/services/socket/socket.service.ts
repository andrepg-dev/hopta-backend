import { COOKIES } from "@/constants/cookies.constants"
import { CORS_OPTIONS } from "@/constants/express-security.constants"
import { UserJWT } from "@/src/middlewares/authMiddleware"
import { MessageConversationModel } from "@/src/schemas/message-conversation.schemas"
import { MessageModel } from "@/src/schemas/message.schemas"
import { TokenManager } from "@/src/utils/JWT/tokens-manager"
import type { Server as HttpServer } from "http"
import { Server, Socket } from "socket.io"

let io: Server | null = null

const conversationRoom = (conversationId: string) => `conversation:${conversationId}`
const userRoom = (userId: string) => `user:${userId}`

const parseCookies = (cookieHeader?: string) => {
  if (!cookieHeader) return {}

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=")
    if (!name || valueParts.length === 0) return cookies

    cookies[name] = decodeURIComponent(valueParts.join("="))
    return cookies
  }, {})
}

const getParticipantId = (participant: any) => {
  if (!participant) return null
  if (participant._id) return participant._id.toString()
  return participant.toString()
}

const canAccessConversation = async (userId: string, conversationId: string) => {
  const conversation = await MessageConversationModel.exists({
    _id: conversationId,
    participants: userId
  })

  return Boolean(conversation)
}

const authenticateSocket = (socket: Socket, next: (error?: Error) => void) => {
  const cookies = parseCookies(socket.handshake.headers.cookie)
  const accessToken = cookies[COOKIES.jwt_access_token.name]

  if (!accessToken) {
    next(new Error("Unauthorized"))
    return
  }

  try {
    const decoded = TokenManager.verifyToken(accessToken) as UserJWT

    if (decoded.exp < Date.now() / 1000) {
      next(new Error("Unauthorized"))
      return
    }

    socket.data.userId = decoded.userId
    next()
  } catch {
    next(new Error("Unauthorized"))
  }
}

export const configureSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: CORS_OPTIONS
  })

  io.use(authenticateSocket)

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string | undefined
    if (!userId) return

    socket.join(userRoom(userId))

    socket.on("conversation:join", async (conversationId: string) => {
      if (!conversationId) return
      if (await canAccessConversation(userId, conversationId)) {
        socket.join(conversationRoom(conversationId))
      }
    })

    socket.on("conversation:leave", (conversationId: string) => {
      if (!conversationId) return
      socket.leave(conversationRoom(conversationId))
    })
  })

  return io
}

export const getSocketServer = () => io

export const getPopulatedConversation = async (conversationId: string) => {
  return MessageConversationModel.findById(conversationId)
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
}

export const getPopulatedMessage = async (messageId: string) => {
  return MessageModel.findById(messageId).populate({
    path: "sender",
    select: "_id name last_name email profile_picture"
  })
}

export const emitMessageEvents = async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
  if (!io) return

  const [conversation, message] = await Promise.all([getPopulatedConversation(conversationId), getPopulatedMessage(messageId)])

  if (!conversation || !message) return

  io.to(conversationRoom(conversationId)).emit("message:new", {
    conversationId,
    message
  })

  io.to(conversationRoom(conversationId)).emit("conversation:updated", {
    conversation
  })

  conversation.participants.map(getParticipantId).forEach((participantId: string | null) => {
    if (!participantId) return
    io?.to(userRoom(participantId)).emit("conversation:updated", {
      conversation
    })
  })
}
