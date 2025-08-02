import { Stripe } from 'stripe'

export const line_items: Record<string, Stripe.Checkout.SessionCreateParams.LineItem> = {
  monthly: {
    quantity: 1,
    price: 'price_1QxkuoRu108A3s8GRmoiQKhl' // Crear el precio de la mensualidad en stripe,
  },
  yearly: {
    quantity: 1,
    price: 'price_1QxkuoRu108A3s8GRmoiQKhl' // Crear el precio de la mensualidad en stripe,
  }
}
