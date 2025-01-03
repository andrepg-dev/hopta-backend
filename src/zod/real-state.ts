import z from 'zod'

export const realStateSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters long.').max(300, 'Title must be at most 100 characters long.'),
  price: z.number().positive('Price must be a positive number').max(90000000, 'Price must be at most $90,000,000'),
  description: z.string().max(300),
  images: z.array(z.string()).max(15),
  location: z.string().max(300),
  city: z.string().max(300)
})
