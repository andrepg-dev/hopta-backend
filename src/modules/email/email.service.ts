import { envs } from '@/constants/env.constants'
import sendgrid, { MailDataRequired } from '@sendgrid/mail'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import Logs from '../logs/save-logs.service'

interface SendMailOptions extends nodemailer.SendMailOptions { }

const templates = {
  verification_code: 'd-4c5c66eae47f47919e5d58f1b302539d'
}

class EmailServiceSendGrid {
  constructor() {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string)
  }

  async sendEmail(
    to: { email: string; name?: string },
    subject: string,
    html: string,
    dynamicTemplateData: Record<string, string>,
    template: keyof typeof templates
  ) {
    let message: MailDataRequired

    if (!template) {
      message = {
        from: { email: process.env.SENDGRID_FROM_EMAIL as string, name: process.env.SENDGRID_FROM_NAME as string },
        to: { email: to.email, name: to.name ?? undefined },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: html
          }
        ]
      }
    } else {
      message = {
        from: { email: process.env.SENDGRID_FROM_EMAIL as string, name: process.env.SENDGRID_FROM_NAME as string },
        to: { email: to.email, name: to.name ?? undefined },
        templateId: templates[template],
        dynamicTemplateData
      }
    }

    const response = await sendgrid.send(message)
    return response
  }
}

class EmailServiceNodeMailer {
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

        new Logs({
          method: 'saveLogs',
          message: sentInfo
        })

        resolve(sentInfo)
      } catch (error: any) {
        new Logs({
          method: 'saveErrorLogs',
          message: error
        })
        reject(error)
      }
    })
  }
}

interface EmailServiceOptions {
  to: { email: string; name?: string }
  subject?: string
  html?: string
  dynamicTemplateData?: Record<string, string>
  template?: keyof typeof templates
  provider?: 'sendgrid' | 'nodemailer'
}

export class EmailService {
  private sendGridService: EmailServiceSendGrid
  private nodeMailerService: EmailServiceNodeMailer

  constructor() {
    this.sendGridService = new EmailServiceSendGrid()
    this.nodeMailerService = new EmailServiceNodeMailer()
  }

  async sendEmail(options: EmailServiceOptions) {
    if (options.provider == 'sendgrid') {
      return this.sendGridService.sendEmail(
        options.to,
        options.subject ?? '',
        options.html ?? '',
        options.dynamicTemplateData ?? {},
        options.template ?? 'verification_code'
      )
    }

    return this.nodeMailerService.sendEmail({
      from: envs.MAILER_EMAIL,
      to: options.to.email,
      subject: options.subject,
      html: options.html
    })
  }
}
