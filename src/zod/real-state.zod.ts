import z from 'zod'

export const realStateSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters long.').max(300, 'Title must be at most 300 characters long.'),
  description: z.string().max(300, 'Description must be at most 300 characters long.'),
  images: z.array(z.string().url('Each image must be a valid URL.')).max(15, 'You can upload a maximum of 15 images.'),
  location: z.object({
    lat: z.number().min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.'),
    lng: z.number().min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.')
  }),
  square_meters: z.number().positive('Square meters must be a positive number').max(100000, 'Square meters must be at most 100,000.').optional(),
  price: z.number().positive('Price must be a positive number').max(90000000, 'Price must be at most $90,000,000').multipleOf(0.01),
  currency: z.enum(['HNL', 'USD', 'EUR']),
  population: z.number().max(40000, 'Population must be at most 40,000.').optional(),
  house_features: z.object({
    rooms: z.number().positive('Rooms must be a positive number').max(20, 'Rooms must be at most 20.'),
    bathrooms: z.number().positive('Bathrooms must be a positive number').max(20, 'Bathrooms must be at most 20.'),
    kitchens: z.number().positive('Kitchens must be a positive number').max(20, 'Kitchens must be at most 20.').optional(),
    interior_extras: z
      .object({
        water_tank: z.boolean().optional(),
        water_cistern: z.boolean().optional(),
        closets: z.boolean().optional(),
        furnished: z.boolean().optional(),
        air_conditioning: z.boolean().optional(),
        '24_7_security': z.boolean().optional(),
        garage: z.boolean().optional()
      })
      .optional(),
    exterior_extras: z
      .object({
        balcony: z.boolean().optional(),
        patio: z.boolean().optional(),
        terrace: z.boolean().optional(),
        garden: z.boolean().optional(),
        swimming_pool: z.boolean().optional()
      })
      .optional(),
    community_extras: z
      .object({
        gym: z.boolean().optional(),
        parks: z.boolean().optional(),
        schools: z.boolean().optional(),
        shopping_malls: z.boolean().optional(),
        supermarkets: z.boolean().optional(),
        elevator: z.boolean().optional()
      })
      .optional()
  }),
  house_status: z
    .object({
      is_available: z.boolean().default(true),
      is_sold: z.boolean().default(false),
      sold_date: z.union([z.string().datetime(), z.date()]).optional()
    })
    .optional(),
  visitors: z
    .array(
      z.object({
        user: z.string(),
        visit_date: z.date().optional(),
        comments: z.string().optional()
      })
    )
    .optional(),
  saved_by: z.array(z.string()).optional(),
  stats: z
    .object({
      total_visits: z.number().default(0),
      total_saves: z.number().default(0)
    })
    .optional(),
  ratings: z
    .array(
      z.object({
        user: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        created_at: z.date().optional()
      })
    )
    .optional(),
  rating_summary: z
    .object({
      average_rating: z.number().default(0),
      total_ratings: z.number().default(0)
    })
    .optional()
})

export const realStateUpdateSchema = z
  .object({
    title: z.string().min(4, 'Title must be at least 4 characters long.').max(300, 'Title must be at most 300 characters long.').optional(),
    description: z.string().max(300, 'Description must be at most 300 characters long.').optional(),
    images: z.array(z.string().url('Each image must be a valid URL.')).max(15, 'You can upload a maximum of 15 images.').optional(),
    location: z
      .object({
        lat: z.number().min(-90, 'Latitude must be between -90 and 90.').max(90, 'Latitude must be between -90 and 90.'),
        lng: z.number().min(-180, 'Longitude must be between -180 and 180.').max(180, 'Longitude must be between -180 and 180.')
      })
      .optional(),
    square_meters: z.number().positive('Square meters must be a positive number').max(100000, 'Square meters must be at most 100,000.').optional(),
    price: z.number().positive('Price must be a positive number').max(90000000, 'Price must be at most $90,000,000').multipleOf(0.01).optional(),
    currency: z.enum(['HNL', 'USD', 'EUR']).optional(),
    population: z.number().max(40000, 'Population must be at most 40,000.').optional(),
    house_features: z
      .object({
        rooms: z.number().positive('Rooms must be a positive number').max(20, 'Rooms must be at most 20.').optional(),
        bathrooms: z.number().positive('Bathrooms must be a positive number').max(20, 'Bathrooms must be at most 20.').optional(),
        kitchens: z.number().positive('Kitchens must be a positive number').max(20, 'Kitchens must be at most 20.').optional(),
        interior_extras: z
          .object({
            water_tank: z.boolean().optional(),
            water_cistern: z.boolean().optional(),
            closets: z.boolean().optional(),
            furnished: z.boolean().optional(),
            air_conditioning: z.boolean().optional(),
            '24_7_security': z.boolean().optional(),
            garage: z.boolean().optional()
          })
          .optional(),
        exterior_extras: z
          .object({
            balcony: z.boolean().optional(),
            patio: z.boolean().optional(),
            terrace: z.boolean().optional(),
            garden: z.boolean().optional(),
            swimming_pool: z.boolean().optional()
          })
          .optional(),
        community_extras: z
          .object({
            gym: z.boolean().optional(),
            parks: z.boolean().optional(),
            schools: z.boolean().optional(),
            shopping_malls: z.boolean().optional(),
            supermarkets: z.boolean().optional(),
            elevator: z.boolean().optional()
          })
          .optional()
      })
      .optional(),
    house_status: z
      .object({
        is_available: z.boolean().optional(),
        is_sold: z.boolean().optional(),
        sold_date: z.union([z.string().datetime(), z.date()]).optional()
      })
      .optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
