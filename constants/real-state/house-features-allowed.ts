export const INTERIOR_FEATURES_ALLOWED = ["water_tank", "water_cistern", "closets", "furnished", "air_conditioning", "garage", "allowPets"] as const
export const EXTERIOR_FEATURES_ALLOWED = ["balcony", "patio", "terrace", "garden", "swimming_pool"] as const
export const COMMUNITY_FEATURES_ALLOWED = ["gym", "parks", "schools", "shopping_malls", "supermarkets", "elevator"] as const
export const SECURITY_FEATURES_ALLOWED = ["gated_community", "24_7_security"] as const
export const UTILITIES_ALLOWED = ["water", "electricity", "internet"] as const

export const HOUSE_FEATURES_ALLOWED = {
  interior: INTERIOR_FEATURES_ALLOWED,
  exterior: EXTERIOR_FEATURES_ALLOWED,
  community: COMMUNITY_FEATURES_ALLOWED,
  security: SECURITY_FEATURES_ALLOWED,
  utilities: UTILITIES_ALLOWED
} as const
