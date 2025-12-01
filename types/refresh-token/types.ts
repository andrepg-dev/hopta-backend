export interface refreshTokenI {
  userId: string
  token: string
  expires: Date
  created_at: Date
  updated_at: Date
  is_active: boolean
}
