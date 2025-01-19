import { envs } from '@/constants/env'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import Logs from '../logs/save-logs'

interface SendMailOptions extends nodemailer.SendMailOptions {}

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
        const sentInfo = this.transporter.sendMail({
          ...options
        })

        // Save logs
        const logger = new Logs()
        logger.saveLogs().info(JSON.stringify(sentInfo))

        resolve(sentInfo)
      } catch (error) {
        // Save logs
        const logger = new Logs()
        logger.saveLogs().error(error)

        reject(error)
      }
    })
  }
}
