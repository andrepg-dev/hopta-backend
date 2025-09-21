import { chromium } from 'playwright'

export async function saveSession() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('https://www.facebook.com/login')

  console.log('🔐 Inicia sesión manualmente y presiona Enter en la terminal...')
  await new Promise((resolve) => process.stdin.once('data', resolve))

  console.log('💾 Guardando sesión...')
  await context.storageState({ path: 'session.json' })

  await browser.close()
}
