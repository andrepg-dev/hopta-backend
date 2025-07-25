import z from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.').max(120),
  last_name: z.string().min(3, 'Last name must be at least 3 characters long.').max(120),
  contact: z
    .object({
      phone_number: z.string().min(6, 'Phone number must be at least 6 characters long.').max(40).optional(),
      email_contact: z.string().email('Invalid email address.').max(120).optional()
    })
    .optional(),
  email: z.string().email('Invalid email address.').max(120),
  password: z.string().min(6, 'Password must be at least 6 characters long.').max(120),
  reviews: z
    .array(
      z.object({
        user: z.string(), // Reference to the user who made the review
        review: z.string().max(4000, 'Review must be at most 4000 characters long.'),
        rating: z.number().min(1, 'Rating must be at least 1.').max(5, 'Rating must be at most 5.')
      })
    )
    .optional(),
  properties: z.array(z.string()).optional(), // References to created properties
  favorites_properties: z.array(z.string()).optional(), // Favorite properties
  profile_picture: z.string().url('Invalid URL format.').max(500, 'Profile picture URL is too long.').optional(),
  location: z
    .array(
      z.object({
        lat: z.number().min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.'),
        lng: z.number().min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.')
      })
    )
    .optional(),
  social_media: z
    .object({
      facebook: z.string().url('Invalid Facebook URL.').max(120).optional(),
      instagram: z.string().url('Invalid Instagram URL.').max(120).optional(),
      twitter: z.string().url('Invalid Twitter URL.').max(120).optional()
    })
    .optional(),
  personal_information: z
    .object({
      identity_document: z.string().min(13, 'Identity document must be at least 13 characters long.').optional(),
      birth_date: z.string().datetime('Invalid date format.').optional(),
    })
    .optional(),
  about: z
    .object({
      education: z.object({
        university: z.string().optional(),
        degree: z.string().optional(),
        end_date: z.string().datetime('Invalid date format.').optional(),
      }).optional(),
      description: z.string().optional(),
    })
    .optional()
})

export const isValidEmail = z.object({
  email: z.string().email('Invalid email address.')
})

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.')
})
