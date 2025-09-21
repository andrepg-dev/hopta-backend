import { AppError } from '@/src/handlers/error-handler'
import { verificationSMSCodeModel } from '@/src/schemas/verify-sms-code.schemas'
import RandomIntUtils from '@/src/utils/random-int.utils'
import { formatPhone } from '@/src/utils/services/format-phone'
import twilio, { Twilio } from 'twilio'

class TwilioSendSMSCodeService {
  protected client: Twilio

  constructor() {
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, {
      lazyLoading: false
    })
  }

  async sendSMSCode({ phone }: { phone: string }) {
    const formattedPhone = formatPhone(phone)

    const code = RandomIntUtils.randomInt()
    const message = `Hopta: Tú código de verificación es: ${code}. No lo compartas con nadie.`

    await verificationSMSCodeModel.create({
      phone,
      code
    })

    await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    })
  }

  /**
   * 
   * @description Verify if the code is valid using the database, after verification, we delete the code on the collection database and return a boolean
   * 
   * @param phone
   * @param code
   * @returns boolean
   */
  async verifySMSCode({ phone, code }: { phone: string; code: string }) {
    const formattedPhone = formatPhone(phone)

    const verification = await verificationSMSCodeModel.findOne({ phone: formattedPhone, code })

    if (!verification) {
      throw new AppError('Invalid or expired verification code', 400)
    }

    if (verification.expires < new Date()) {
      throw new AppError('Verification code has expired', 400)
    }

    // after verification, delete the code
    await verificationSMSCodeModel.deleteOne({ _id: verification._id })

    return verification ? true : false
  }
}

export class SMSSender extends TwilioSendSMSCodeService {
  constructor() {
    super()
  }

  async sendSMS({ phone, message }: { phone: string; message: string }) {
    const formattedPhone = formatPhone(phone)

    await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    })
  }
}
