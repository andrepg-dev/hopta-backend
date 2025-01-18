import z from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  last_name: z.string().min(3, 'Last name must be at least 3 characters long.'),
  contact: z.object({
    phone_number: z.string().min(6, 'Phone number must be at least 6 characters long.').optional(),
    is_phone_number_verified: z.boolean().optional(),
    email_contact: z.string().email('Invalid email address.').optional()
  }).optional(),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  reviews: z
    .array(
      z.object({
        user: z.string(), // This should be a reference to the user that made the review
        review: z.string(),
        rating: z.number().min(1).max(5)
      })
    )
    .optional(),
  properties: z.array(z.string()).optional(),
  favorites_properties: z.array(z.string()).optional(),
  is_verified: z.boolean().optional(),
  profile_picture: z.string().optional(),
  location: z.array(z.string()).optional(),
  social_media: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional()
    })
    .optional(),
  identity_number: z.string().optional()
})

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.')
})
