import { AppError } from "@/src/handlers/error-handler";
import { verificationSMSCodeModel } from "@/src/schemas/verify-sms-code.schemas";
import RandomIntUtils from "@/src/utils/random-int.utils";
import twilio, { Twilio } from "twilio";

class TwilioSendSMSCodeService {
  protected client: Twilio

  constructor() {
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, {
      lazyLoading: false
    })
  }

  protected formatPhone(phone: string) {
    return phone.startsWith('+') ? phone : `+${phone}`.replaceAll(' ', '')
  }

  async sendSMSCode({ phone }: { phone: string }) {
    const formattedPhone = this.formatPhone(phone)

    const code = RandomIntUtils.randomInt()
    const message = `Your verification code is: ${code}. Don't share this code with anyone.`

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

  async verifySMSCode({ phone, code }: { phone: string, code: string }) {
    const formattedPhone = this.formatPhone(phone)

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

export class TwilioSendSMS extends TwilioSendSMSCodeService {
  constructor() {
    super()
  }

  async sendSMS({ phone, message }: { phone: string, message: string }) {
    const formattedPhone = this.formatPhone(phone)

    await this.client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    })
  }
}