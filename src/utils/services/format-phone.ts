export const formatPhone = (phone: string) => {
  return phone.startsWith('+') ? phone : `+${phone}`.replaceAll(' ', '')
}