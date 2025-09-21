export function passwordGenerator({ length }: { length: number }) {
  const optionsAvailable = 'QWERTYUIOPA}*SDF|GHJKLZ<XCVBNM1}234+{567890qwertyuiopasdfghjklzxcvbnm'
  let generatedPassword = ''

  for (let i = 0; i < length; i++) {
    let randomNumber = Math.round(Math.random() * optionsAvailable.length) ?? 0
    while (randomNumber == optionsAvailable.length) {
      randomNumber--
      break
    }
    generatedPassword += optionsAvailable[randomNumber]
  }
  return generatedPassword
}
