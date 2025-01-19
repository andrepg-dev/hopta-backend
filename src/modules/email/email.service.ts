import { envs } from '@/constants/env'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'

interface SendMailOptions extends nodemailer.SendMailOptions {
  to: string
  subject: string
  htmlBody: string
}

export class EmailService {
  private transporter = nodemailer.createTransport({
    service: envs.MAILER_SERVICE,
    auth: {
      user: envs.MAILER_EMAIL,
      pass: envs.MAILER_PASSWORD
    }
  })

  async sendEmail(options: SendMailOptions): Promise<SMTPTransport.SentMessageInfo> {
    return new Promise((resolve, reject) => {
      try {
        const { to, subject, htmlBody, ...restOptions } = options

        const sentInfo = this.transporter.sendMail({
          to: to,
          subject,
          html: htmlBody,
          ...restOptions
        })

        resolve(sentInfo)
      } catch (error) {
        reject(error)
      }
    })
  }
}
