import { HOUSE_FEATURES_ALLOWED } from "@/constants/real-state/house-features-allowed"
import { PROPERTY_TYPE } from "@/constants/real-state/property_type"
import z from "zod"

export const realStateSchema = z.object({
  title: z.string().min(4, "Title must be at least 4 characters long.").max(300, "Title must be at most 300 characters long."),
  description: z.string().max(4500, "Description must be at most 4500 characters long."),
  images: z
    .array(z.string().url("Each image must be a valid URL."))
    .min(3, "You must upload at least 3 images.")
    .max(40, "You can upload a maximum of 40 images."),
  property_type: z.enum(PROPERTY_TYPE),
  one_month_upfront: z.boolean(),
  location: z.object({
    title: z.string().min(4, "Title must be at least 4 characters long.").max(300, "Title must be at most 300 characters long."),
    type: z.string().min(3).max(15).optional().default("Point"),
    coordinates: z.array(z.number()).max(2)
  }),
  square_meters: z.number().positive("Square meters must be a positive number").max(100000, "Square meters must be at most 100,000.").optional(),
  price: z.number().int("Price must be an integer").positive("Price must be a positive number").max(90000000, "Price must be at most $90,000,000"),
  currency: z.enum(["HNL", "USD", "EUR"]),
  population: z.number().max(40000, "Population must be at most 40,000.").optional(),
  additional_cost: z
    .object({
      // owner will pay for these utilities
      utilities_included: z.array(z.enum(HOUSE_FEATURES_ALLOWED.utilities)).optional(),
      water: z.number().optional().nullable(),
      electricity: z.number().optional().nullable()
    })
    .optional(),
  house_features: z.object({
    rooms: z.number().positive("Rooms must be a positive number").max(20, "Rooms must be at most 20."),
    bathrooms: z.number().positive("Bathrooms must be a positive number").max(20, "Bathrooms must be at most 20.").optional(),
    interior_extras: z.array(z.enum(HOUSE_FEATURES_ALLOWED.interior)).optional(),
    exterior_extras: z.array(z.enum(HOUSE_FEATURES_ALLOWED.exterior)).optional(),
    community_extras: z.array(z.enum(HOUSE_FEATURES_ALLOWED.community)).optional(),
    security: z.array(z.enum(HOUSE_FEATURES_ALLOWED.security)).optional()
  }),
  house_status: z
    .object({
      is_available: z.boolean().default(true),
      is_sold: z.boolean().default(false),
      sold_date: z.union([z.string().datetime(), z.date()]).optional()
    })
    .optional()
})

export const realStateUpdateSchema = z
  .object({
    title: z.string().min(4, "Title must be at least 4 characters long.").max(300, "Title must be at most 300 characters long.").optional(),
    description: z.string().max(4500, "Description must be at most 4500 characters long.").optional(),
    images: z.array(z.string().url("Each image must be a valid URL.")).max(15, "You can upload a maximum of 15 images.").optional(),
    property_type: z.enum(PROPERTY_TYPE).optional(),
    one_month_upfront: z.boolean().optional(),
    location: z
      .object({
        title: z.string().min(4, "Title must be at least 4 characters long.").max(300, "Title must be at most 300 characters long."),
        type: z.string().min(3).max(15).default("Point"),
        coordinates: z.array(z.number()).max(2)
      })
      .optional(),
    square_meters: z.number().positive("Square meters must be a positive number").max(100000, "Square meters must be at most 100,000.").optional(),
    price: z.number().positive("Price must be a positive number").max(90000000, "Price must be at most $90,000,000").multipleOf(0.01).optional(),
    currency: z.enum(["HNL", "USD", "EUR"]).optional(),
    population: z.number().max(40000, "Population must be at most 40,000.").optional(),
    additional_cost: z
      .object({
        // owner will pay for these utilities
        utilities_included: z.array(z.enum(HOUSE_FEATURES_ALLOWED.utilities)).optional(),
        water: z.number().optional().nullable(),
        electricity: z.number().optional().nullable()
      })
      .optional(),
    house_features: z
      .object({
        rooms: z.number().positive("Rooms must be a positive number").max(20, "Rooms must be at most 20.").optional(),
        bathrooms: z.number().positive("Bathrooms must be a positive number").max(20, "Bathrooms must be at most 20.").optional(),
        interior_extras: z.array(z.enum(HOUSE_FEATURES_ALLOWED.interior)).optional(),
        exterior_extras: z.array(z.enum(HOUSE_FEATURES_ALLOWED.exterior)).optional(),
        community_extras: z.array(z.enum(HOUSE_FEATURES_ALLOWED.community)).optional(),
        security: z.array(z.enum(HOUSE_FEATURES_ALLOWED.security)).optional()
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
    message: "At least one field must be provided for update"
  })
