import { envs } from '@/constants/env.constants'
import sendgrid, { MailDataRequired } from '@sendgrid/mail'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import Logs from '../logs/save-logs.service'

interface SendMailOptions extends nodemailer.SendMailOptions { }

class EmailServiceSendGrid {
  constructor() { }

  async sendEmail(to: { email: string, name?: string }, subject: string, html: string) {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string)

    const message: MailDataRequired = {
      from: { email: process.env.SENDGRID_FROM_EMAIL as string, name: process.env.SENDGRID_FROM_NAME as string },
      to: { email: to.email, name: to.name ?? undefined },
      subject: subject,
      content: [{
        type: 'text/html',
        value: html
      }]
    };

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
  to: { email: string, name?: string }
  subject: string
  html: string
  provider?: 'sendgrid' | 'nodemailer'
}

export class EmailService {
  private sendGridService: EmailServiceSendGrid;
  private nodeMailerService: EmailServiceNodeMailer;

  constructor() {
    this.sendGridService = new EmailServiceSendGrid()
    this.nodeMailerService = new EmailServiceNodeMailer()
  }

  async sendEmail(options: EmailServiceOptions) {

    if (options.provider == 'sendgrid') {
      return this.sendGridService.sendEmail(options.to, options.subject, options.html)
    }

    return this.nodeMailerService.sendEmail({
      from: envs.MAILER_EMAIL,
      to: options.to.email,
      subject: options.subject,
      html: options.html
    })
  }
}
