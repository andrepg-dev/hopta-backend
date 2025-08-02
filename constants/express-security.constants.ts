import rateLimit from 'express-rate-limit'

export const RATE_LIMIT = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 150,
  message: 'Too many requests from this IP, please try again later!',
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429
})

// TODO: Cambiar el origen a la URL de producción
export const CORS_OPTIONS = {
  origin: ['http://localhost:3000', 'https://hopta.hn', 'https://www.hopta.hn', 'http://localhost:3002'], // Permitir solo este origen
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true, // Permitir cookies y credenciales
  maxAge: 3600 // Almacenar en caché los resultados de CORS por 1 hora
}
