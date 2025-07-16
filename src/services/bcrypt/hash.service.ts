import bcrypt from 'bcrypt'

export const hashGen = async (password: string, saltRounds: number = 10) => {
  return await bcrypt.hash(password, saltRounds)
}

export const hashCompare = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword)
}

export const hashGenSalt = async (saltRounds: number = 10) => {
  return await bcrypt.genSalt(saltRounds)
}

