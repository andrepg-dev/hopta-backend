import fs from 'fs'
import path from 'path'

function checkEnviromentVariables(enviroments: string[]) {
  for (let name of enviroments) {
    if (!process.env[`${name}`]) {
      console.log(`Error: ${name} IS MISSING`)
      process.exit(1) // exit with error
    }
  }
}

function findEnvFile(dir: string): string | null {
  const envPath = path.join(dir, '.env')
  if (fs.existsSync(envPath)) return envPath

  const parentDir = path.dirname(dir)
  if (parentDir === dir) return null // llegó a la raíz del sistema
  return findEnvFile(parentDir)
}

function extractEnviromentsNames(file: string | undefined): string[] {
  if (!file) throw new Error('File content cannot be find')

  return file
    .split('\n')
    .filter((value: string) => value != '')
    .filter((value) => !value.startsWith('#'))
    .map((value) => value.split('=')[0]) as string[]
}

function getFileContent(path: null | string) {
  if (path == null) throw new Error('Cannot find pathname')

  try {
    const data = fs.readFileSync(path, 'utf-8')
    return data
  } catch (error) {
    return undefined
  }
}

// Execution (solo cuando se ejecuta directamente)
if (require.main === module) {
  // Buscar desde el directorio actual hacia arriba
  const envPath = findEnvFile(process.cwd())
  if (envPath) {
    const fileContent = getFileContent(envPath)
    const extract = extractEnviromentsNames(fileContent)
    console.log(extract)
  } else {
    console.error('No se encontró el archivo .env')
  }
}

// <================== REAL USE CASE ==================>
const enviroments = [
  'NODE_ENV',
  'PORT',
  'PASSWORD',
  'DATABASE_NAME',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_FROM_EMAIL',
  'OLD_AWS_ACCESS_KEY_ID',
  'OLD_AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'JWT_REFRESH_SECRET_KEY',
  'JWT_ACCESS_SECRET_KEY',
  'GENERAL_COOKIES_SECRET_KEY',
  'COOKIE_SECRET',
  'MAILER_SERVICE',
  'MAILER_EMAIL',
  'MAILER_PASSWORD',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'SENDGRID_FROM_NAME',
  'RESEND_API_KEY',
  'APPLICATION_ID',
  'SEARCH_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
  'GOOGLE_SECRET_KEY',
  'FACEBOOK_APP_ID',
  'FACEBOOK_APP_SECRET',
  'STRIPE_API_KEY',
  'FRONTEND_URL',
  'ALGOLIA_APP_ID',
  'ALGOLIA_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'ANTHROPIC_API_KEY'
]

export function verifyEnviroment() {
  checkEnviromentVariables(enviroments)
}
