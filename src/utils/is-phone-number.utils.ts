export function isPhoneNumber(phone: string) {
  const pattern = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g;
  return pattern.test(phone);
}