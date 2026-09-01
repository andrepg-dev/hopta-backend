import { connectToDatabase } from "@/connection/connect"
import { CONNECTIONS } from "@/constants/connection.constants"
import { CORS_OPTIONS, RATE_LIMIT } from "@/constants/express-security.constants"
import Logs from "@/src/services/logs/save-logs.service"
import cookieParser from "cookie-parser"
import cors from "cors"
import express, { Request, Response } from "express"
import session from "express-session"
import helmet from "helmet"
import http from "http"
import passport from "passport"
import { errorHandler } from "./handlers/error-handler"
import { attactExpressResponse } from "./handlers/response-adapter"
import { decodeUserToken } from "./middlewares/decode-user"
import LastSeen from "./middlewares/last-seen"
import aiRouter from "./routes/ai/route"
import "./routes/auth/google/google-auth.config"
import googleRouter from "./routes/auth/google/google.route"
import s3UploadImageRouter from "./routes/aws/s3/s3.route"
import contactRouter from "./routes/contact-router/route"
import facebookRouter from "./routes/facebook/facebook.route"
import healthRouter from "./routes/health/route"
import messagesRouter from "./routes/messages/route"
import realStateReportRouter from "./routes/real-state-report/route"
import RealStateRouter from "./routes/real-state/route"
import statsRouter from "./routes/stats/stats.route"
import stripeRouter from "./routes/stripe/route"
import supportRouter from "./routes/support/route"
import suscribeRouter from "./routes/suscribe/route"
import tokenRouter from "./routes/token/route"
import userRouter from "./routes/user/route"
import stripeWebhookRouter from "./routes/webhooks/stripe/payments.routes"
import { configureSocketServer } from "./services/socket/socket.service"
import { verifyEnviroment } from "./utils/check-enviroments-variables"

// Prevent process crashes from failing background async tasks (e.g. email/SMTP timeouts).
// Without these, an unhandled promise rejection kills the whole process and nginx
// responds with 502 Bad Gateway until the container restarts.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason)
  new Logs({
    method: "saveErrorLogs",
    message: `Unhandled Promise Rejection: ${reason}`
  })
})

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error)
  new Logs({
    method: "saveErrorLogs",
    message: `Uncaught Exception: ${error.message}`
  })
})

// Check if all enviroments exists
verifyEnviroment()

// Database connection
connectToDatabase()

// Express configuration
export const app = express()

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1) // CLOUDFLARE + ELB
}

// Middlewares
app.use(cors(CORS_OPTIONS))
app.options("*", cors(CORS_OPTIONS))

app.use(RATE_LIMIT)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
  })
)
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(
  session({
    secret: process.env.GOOGLE_SECRET_KEY!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.NODE_ENV === "production" ? ".hopta.hn" : undefined,
      path: "/"
    }
  })
)

app.use(passport.initialize())

const port = CONNECTIONS.PORT

app.get("/", async (_: Request, res: Response) => {
  res.status(200).send("Welcome to Hopta")
})

app.use(decodeUserToken)
app.use(LastSeen)

app.use((_, res, next) => {
  attactExpressResponse(res)
  next()
})

app.use("/health", healthRouter)
app.use("/upload-image", s3UploadImageRouter)
app.use("/real-state", RealStateRouter)
app.use("/user", userRouter)
app.use("/auth/google", googleRouter)
app.use("/auth/facebook", facebookRouter)
app.use("/payments", stripeRouter)
app.use("/refresh-token", tokenRouter)
app.use("/webhooks/stripe/payments", stripeWebhookRouter)
app.use("/reports", realStateReportRouter)
app.use("/support", supportRouter)
app.use("/suscribe", suscribeRouter)
app.use("/contact", contactRouter)
app.use("/stats", statsRouter)
app.use("/ai", aiRouter)
app.use("/messages", messagesRouter)

app.use(errorHandler)

function main(port: number) {
  const server = http.createServer(app)
  configureSocketServer(server)

  server.on("error", (error: Error) => {
    if (error.message.includes("EADDRINUSE")) {
      console.warn(`Port ${port} is already in use, trying with another port...`)
      const newPort = port + 1
      server.close()
      main(newPort)
    }
  })

  server.on("listening", () => {
    new Logs({
      method: "saveLogs",
      message: `Hopta server is running! http://localhost:${port}`
    })
  })

  server.listen(port)
}

main(Number(port))
