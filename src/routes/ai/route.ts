// FUTURO:
// TODO: subir imágenes a la API de Anthropic
// TODO: mostrar los datos de la ubicación a la API para que tenga los datos de la ubicación recolectada

import { responseHandler } from '@/src/handlers/responseHandler'
import Anthropic from '@anthropic-ai/sdk'
import { Router } from 'express'
const aiRouter = Router()

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY']
})

aiRouter.post('/generate-description', async (req, res) => {
  const { form } = req.body

  console.log({ form })

  try {
    // Configurar headers para Server-Sent Events (SSE)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    // Función helper para enviar datos SSE
    const sendSSE = (eventType: string, data: any) => {
      res.write(`event: ${eventType}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Enviar evento de inicio
    sendSSE('start', { message: 'Generando descripción...' })

    // Crear stream con Anthropic
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      messages: [
        {
          role: 'assistant',
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
            10.Avoid exaggerations or filler language.

          You should know:
            1. The price of the light and water expenses is one month of the rent approximately.

          Important:
          Return only the text with properly formatted content. Do not include any explanation, comments, or additional text.
          `.trim()
        },
        {
          role: 'user',
          content: `
          Property data (input):
            ${JSON.stringify(form)}
          `.trim()
        }
      ],
      max_tokens: 900,
      temperature: 0.5,
      stream: true // Habilitar streaming
    })

    let fullContent = ''

    // Procesar el stream
    for await (const messageStreamEvent of stream) {
      if (messageStreamEvent.type === 'content_block_delta') {
        // Verificar si el delta tiene texto
        if ('text' in messageStreamEvent.delta) {
          const deltaText = messageStreamEvent.delta.text
          if (deltaText) {
            fullContent += deltaText

            // Enviar cada chunk al frontend
            sendSSE('chunk', {
              content: deltaText,
              fullContent: fullContent
            })
          }
        }
      }
    }

    // Enviar evento de finalización
    sendSSE('complete', {
      message: 'Descripción generada exitosamente',
      finalContent: fullContent
    })

    // Cerrar la conexión
    res.write('event: close\n')
    res.end()
  } catch (error) {
    console.error('Error en streaming:', error)

    // Enviar error via SSE
    res.write('event: error\n')
    res.write(
      `data: ${JSON.stringify({
        error: 'Error al generar la descripción',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })}\n\n`
    )
    res.end()
  }
})

aiRouter.post('/generate-title/stream', async (req, res) => {
  const { form } = req.body

  console.log({ form })

  try {
    // Configurar headers para Server-Sent Events (SSE)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    // Función helper para enviar datos SSE
    const sendSSE = (eventType: string, data: any) => {
      res.write(`event: ${eventType}\n`)
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    // Enviar evento de inicio
    sendSSE('start', { message: 'Generando título...' })

    // Crear stream con Anthropic
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-haiku-latest',
      messages: [
        {
          role: 'assistant',
          content: `You are a professional assistant for generating real estate titles.

          Your task is:
            1. Write a property title in Spanish.
            2. Output only the title, formatted as plain text.

          Guidelines for the title:
            1. The title should be in Spanish.
            2. The title should be 10 words or less.
            3. The title should be a single sentence.
            4. Include one of the most important house features in the title.
            5. Include the location title.
            6. Put in the title the word "rent" or "rent in" if it is a rent and "apartment" if the rent has an elevator.
          
          Important:
          Return only the text with properly formatted content. Do not include any explanation, comments, or additional text.
          `.trim()
        },
        {
          role: 'user',
          content: `
          Property data (input):
            ${JSON.stringify(form)}
          `.trim()
        }
      ],
      max_tokens: 900,
      temperature: 0.5,
      stream: true // Habilitar streaming
    })

    let fullContent = ''

    // Procesar el stream
    for await (const messageStreamEvent of stream) {
      if (messageStreamEvent.type === 'content_block_delta') {
        // Verificar si el delta tiene texto
        if ('text' in messageStreamEvent.delta) {
          const deltaText = messageStreamEvent.delta.text
          if (deltaText) {
            fullContent += deltaText

            // Enviar cada chunk al frontend
            sendSSE('chunk', {
              content: deltaText,
              fullContent: fullContent
            })
          }
        }
      }
    }

    // Enviar evento de finalización
    sendSSE('complete', {
      message: 'Título generado exitosamente',
      finalContent: fullContent
    })

    // Cerrar la conexión
    res.write('event: close\n')
    res.end()
  } catch (error) {
    console.error('Error en streaming:', error)

    // Enviar error via SSE
    res.write('event: error\n')
    res.write(
      `data: ${JSON.stringify({
        error: 'Error al generar el título',
        details: error instanceof Error ? error.message : 'Error desconocido'
      })}\n\n`
    )
    res.end()
  }
})

aiRouter.post('/generate-title', async (req, res) => {
  const { form } = req.body

  try {
    const message = await anthropic.messages.create({
      max_tokens: 900,
      messages: [
        {
          role: 'assistant',
          content: `You are a professional assistant for generating real estate titles.

          Your task is:
            1. Write a property title in Spanish.
            2. Output only the title, formatted as plain text.

          Guidelines for the title:
            1. The title should be in Spanish.
            2. The title should be 10 words or less.
            3. The title should be a single sentence.
            4. Include one of the most important house features in the title.
            5. Include the location title.
            6. Put in the title the word "rent" or "rent in" if it is a rent and "apartment" if the rent has an elevator.
          
          Important:
          Return only the text with properly formatted content. Do not include any explanation, comments, or additional text.
          `.trim()
        },
        {
          role: 'user',
          content: `
          Property data (input):
            ${JSON.stringify(form)}
          `.trim()
        }
      ],
      model: 'claude-3-5-haiku-latest'
    })

    responseHandler({
      res,
      code: 200,
      data: message.content[0]
    })
  } catch (error) {
    responseHandler({
      res,
      code: 500,
      message: 'Title cannot be created'
    })
  }
})

export default aiRouter
