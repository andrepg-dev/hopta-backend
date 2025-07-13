// TODO: subir imágenes a la API de Anthropic

import { responseHandler } from '@/src/handlers/responseHandler';
import Anthropic from '@anthropic-ai/sdk';
import { Router } from 'express';
const aiRouter = Router()

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY']
});

aiRouter.post('/generate-description', async (req, res) => {
  const { form } = req.body

  console.log({ form })

  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    messages: [
      {
        role: 'assistant',
        content: `You are a real estate marketing assistant.

        Your task is:
          1. Generate a property description in Spanish.
          2. Return the description strictly in a JSON format.

        Instructions for crafting the description:
          1. Highlight the property's proximity to transit, dining, shopping, and other local attractions.
          2. Mention any upgrades, appealing amenities, and standout features.
          3. Emphasize the property's unique selling points based on its characteristics.
          4. Use several sentences to describe upgrades and features that would appeal to potential buyers or renters.

        Property data (input):
          ${JSON.stringify(form)}

        Expected output format:
          {
            "description": "<Property description in Spanish>"
          }
        Important:
        Return only the JSON object with properly formatted content. Do not include any explanation, comments, or additional text.
        `
      }
    ],
    max_tokens: 900,
    temperature: 0.5,
  })

  console.log({ msg })

  responseHandler({
    res,
    code: 200,
    message: 'Description generated successfully',
    data: msg.content
  })
})

export default aiRouter