import { chromium } from "playwright"

export async function saveSession() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto("https://www.facebook.com/login")

  await new Promise((resolve) => process.stdin.once("data", resolve))

  await context.storageState({ path: "session.json" })

  await browser.close()
}
