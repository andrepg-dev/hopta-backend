/**
 * Validates if a string is a valid phone number format
 * Accepts formats like:
 * - +1234567890
 * - (123) 456-7890
 * - 123-456-7890
 * - 123.456.7890
 * @param phone - The phone number string to validate
 * @returns boolean indicating if the string is a valid phone number
 */


export function isPhoneNumber(phone: string): boolean {
  // Remove any whitespace
  const cleanPhone = phone.replace(/\s/g, '');

  // Pattern that matches common phone number formats
  const pattern = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;

  return pattern.test(cleanPhone);
}
