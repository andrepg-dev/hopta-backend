import { formatPhone } from "@/src/utils/services/format-phone"
import twilio, { Twilio } from "twilio"
import Logs from "../logs/save-logs.service"

class SendWhatsAppMsgService {
  protected client: Twilio
  phone: string

  constructor(phone: string) {
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN, {
      lazyLoading: false
    })

    this.phone = formatPhone(phone)
  }

  async sendWhatsAppMSG({ message }: { message: string }) {
    const msg = await this.client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${this.phone}`
    })

    new Logs({
      message: msg.body,
      method: "saveLogs"
    })

    return msg
  }
}

export class WhatsAppMSGSender extends SendWhatsAppMsgService {
  constructor(phone: string) {
    super(phone)
  }
}
