// FUTURO:
// TODO: subir imágenes a la API de Anthropic
// TODO: mostrar los datos de la ubicación a la API para que tenga los datos de la ubicación recolectada

import Anthropic from "@anthropic-ai/sdk"
import { Router } from "express"
const aiRouter = Router()

const anthropic = new Anthropic({
  apiKey: process.env["ANTHROPIC_API_KEY"]
})

aiRouter.post("/generate-description", async (req, res) => {
  const { form } = req.body

  const allowedOrigins = ["https://hopta.hn", "https://www.hopta.hn", "https://admin.hopta.hn", "http://localhost:3005", "http://localhost:3002"]
  const origin = req.headers.origin

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin)
  }

  try {
    // Configurar headers para Server-Sent Events (SSE)
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    })

    res?.flushHeaders?.()

    // Función helper para enviar datos SSE
    const sendSSE = (eventType: string, data: any) => {
      res.write(`event: ${eventType}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Enviar evento de inicio
    sendSSE("start", { message: "Generando descripción..." })

    // Crear stream con Anthropic
    const stream = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      messages: [
        {
          role: "assistant",
          content: `You are a professional assistant for generating real estate descriptions.

          Your task is:
            1. Write a property description in Spanish.
            2. Output only the description, formatted as plain text.

          Guidelines for the description:
            1. Highlight the property's proximity to transit, dining, shopping, and other local attractions.
            2. Mention any upgrades, appealing amenities, and standout features.
            3. Emphasize the property's unique selling points based on its characteristics.
            4. Write several sentences describing the upgrades and desirable features that will attract renters to your property.
            5. Use **bold** to highlight the most important words.
            6. Use less than 950 and more than 600 characters.
            7. Use spaces between sentences to make it more readable.
            8. Make it professional and not too informal.
            9. Use a professional and neutral tone (not too informal, not overly promotional).
            10. Avoid exaggerations or filler language.
            11. The title should start with the word of the property type "<property_type>" and the location.
            12. The location is from Honduras

          You should know:
            1. The price of the light and water expenses is one month of the rent approximately only, but it problably includes on selling a house or rent, not for lands.

          Important:
          Return only the text with properly formatted content. Do not include any explanation, comments, or additional text.
          `.trim()
        },
        {
          role: "user",
          content: `
          Property data (input):
            ${JSON.stringify(form)}
          `.trim()
        }
      ],
      max_tokens: 900,
      temperature: 1,
      stream: true // Habilitar streaming
    })

    let fullContent = ""

    // Procesar el stream
    for await (const messageStreamEvent of stream) {
      if (messageStreamEvent.type === "content_block_delta") {
        // Verificar si el delta tiene texto
        if ("text" in messageStreamEvent.delta) {
          const deltaText = messageStreamEvent.delta.text
          if (deltaText) {
            fullContent += deltaText

            // Enviar cada chunk al frontend
            sendSSE("chunk", {
              content: deltaText,
              fullContent: fullContent
            })
          }
        }
      }
    }

    // Enviar evento de finalización
    sendSSE("complete", {
      message: "Descripción generada exitosamente",
      finalContent: fullContent
    })

    // Cerrar la conexión
    res.write("event: close\n")
    res.end()
  } catch (error) {
    console.error("Error en streaming:", error)

    // Enviar error via SSE
    res.write("event: error\n")
    res.write(
      `data: ${JSON.stringify({
        error: "Error al generar la descripción",
        details: error instanceof Error ? error.message : "Error desconocido"
      })}\n\n`
    )
    res.end()
  }
})

export default aiRouter
