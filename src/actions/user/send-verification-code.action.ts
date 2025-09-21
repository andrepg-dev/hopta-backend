import { verificationCodeModel } from "@/src/schemas/verification-code.schemas"
import { EmailService } from "@/src/services/email/email.service"
import RandomIntUtils from "@/src/utils/random-int.utils"
import { UserI } from "@/types/login/user"

export class VerificationCode {
  constructor() { }

  static async SendGmailVerificationCode(email: string, user: UserI, subject?: string, html?: string) {
    const verificationCode = RandomIntUtils.randomInt()

    const userData = {
      email: email.toLowerCase(),
      code: verificationCode,
      userData: user
    }

    await verificationCodeModel.create(userData) // Add to the database

    const emailService = new EmailService()

    await emailService.sendEmail({
      to: {
        email: email.toLowerCase(),
        name: user.name
      },
      subject: subject ?? 'Forgot password',
      html: html ?? `Your verification code is ${verificationCode}`,
      provider: 'amazon-ses'
    })
  }

  // use template
}