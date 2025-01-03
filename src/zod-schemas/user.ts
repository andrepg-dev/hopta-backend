import z from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(8, 'Name must be at least 8 characters long.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters long.')
})

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.')
})
