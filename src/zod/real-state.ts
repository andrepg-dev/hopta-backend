import z from 'zod'

export const realStateSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters long.').max(300, 'Title must be at most 100 characters long.'),
  description: z.string().max(300),
  images: z.array(z.string()).max(15),
  location: z.string().max(300),
  square_meters: z.string().max(300),
  price: z.number().positive('Price must be a positive number').max(90000000, 'Price must be at most $90,000,000'),
  currency: z.string().max(40).optional().default('HNL'),
  population: z.number().max(40000, 'Population must be at most 90,000,000').optional(),
  house_feautures: z.object({
    rooms: z.number().positive('Rooms must be a positive number').max(20, 'Rooms must be at most 20'),
    bathrooms: z.number().positive('Bathrooms must be a positive number').max(20, 'Bathrooms must be at most 20'),
    kitchens: z.number().max(20, 'Kitchens must be at most 20').optional(),
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
  owner: z.string().max(300), // Aquí se pasará el id del usuario
  house_status: z.object({
    is_available: z.boolean(),
    is_sold: z.boolean(),
    sold_date: z.date().optional()
  }),
  created_at: z.date().optional()
})
