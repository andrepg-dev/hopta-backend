export function validateEmailFormat(email: string): Boolean {
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
  const result = regex.test(email)
  return result
}
