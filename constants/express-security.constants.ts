import rateLimit from "express-rate-limit"

export const RATE_LIMIT = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 150,
  message: "Too many requests from this IP, please try again later!",
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429
})

export const CORS_OPTIONS = {
  origin: [
    "https://hopta.hn",
    "https://www.hopta.hn",
    "https://admin.hopta.hn",
    "https://development.hopta.hn",
    "http://localhost:3005",
    "http://localhost:3002"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  maxAge: 3600
}
