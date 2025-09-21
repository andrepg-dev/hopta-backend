import { envs } from '@/constants/env.constants'
import { AppError } from '@/src/handlers/error-handler'
import sendgrid, { MailDataRequired } from '@sendgrid/mail'
import AWS from 'aws-sdk'
import { SendEmailRequest } from 'aws-sdk/clients/ses'
import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import Logs from '../logs/save-logs.service'

const ses = new AWS.SES({ region: process.env.AWS_REGION })

interface SendMailOptions extends nodemailer.SendMailOptions { }

const templates = {
  verification_code: 'd-4c5c66eae47f47919e5d58f1b302539d',
  forgot_password: 'd-4a0965ccf5e5485ba6c218202906af7b',
  contact: 'd-a0f7418714bb4f9ebac4890f892d029f'
}

const templatesAmazonSES = {
  contact: 'hopta-contact',
  forgot_password: 'hopta-forgot-password',
  verification_code: 'hopta-code-verification',
}

/**
 * Sendgrid service
 */
class EmailServiceSendGrid {
  constructor() {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY as string)
  }

  async sendEmail(
    to: { email: string; name?: string },
    subject: string,
    html: string,
    dynamicTemplateData?: Record<string, string>,
    template?: keyof typeof templates
  ) {
    try {
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
    } catch (error: any) {
      new Logs({
        method: 'saveErrorLogs',
        message: error
      })

      throw new AppError(error.message, 500)
    }
  }
}

/**
 * Node mailer service
 */
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

interface SendEmailAmazonSESOptions {
  to: { email: string; name?: string }
  subject: string
  html: string
  template?: keyof typeof templatesAmazonSES
  dynamicTemplateData?: Record<string, string>
}

class EmailServiceAmazonSESService {
  async sendEmail({ to, subject, html, template, dynamicTemplateData }: SendEmailAmazonSESOptions) {
    // Sending message with template
    if (template) {
      const params: AWS.SES.SendTemplatedEmailRequest = {
        Source: process.env.AWS_FROM_EMAIL ?? '',
        Destination: {
          ToAddresses: [to.email]
        },
        // using amazon ses templates
        Template: templatesAmazonSES[template],
        TemplateData: JSON.stringify(dynamicTemplateData)
      }

      try {
        const result = await ses.sendTemplatedEmail(params).promise()
        console.log(result)
        return result
      } catch (error) {
        console.error('Error sending email with Amazon SES:', error)
        throw new AppError('Failed to send email with Amazon SES', 500)
      }
    }

    // Sending message without template
    const params: SendEmailRequest = {
      Destination: {
        ToAddresses: [to.email]
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: process.env.AWS_FROM_EMAIL ?? ''
    }


    try {
      const result = await ses.sendEmail(params).promise()
      console.log(result)
      return result
    } catch (error) {
      console.error('Error sending email with Amazon SES:', error)
      throw new AppError('Failed to send email with Amazon SES', 500)
    }
  }
}

/**
 * Email service options
 */
export interface EmailServiceOptions {
  to: { email: string; name?: string }
  subject?: string
  html?: string
  dynamicTemplateData?: Record<string, string>
  template?: keyof typeof templates | keyof typeof templatesAmazonSES
  provider: 'sendgrid' | 'nodemailer' | 'amazon-ses'
}

/**
 * Email service
 */
export class EmailService {
  private sendGridService: EmailServiceSendGrid
  private nodeMailerService: EmailServiceNodeMailer
  private amazonSESService: EmailServiceAmazonSESService

  constructor() {
    this.sendGridService = new EmailServiceSendGrid()
    this.nodeMailerService = new EmailServiceNodeMailer()
    this.amazonSESService = new EmailServiceAmazonSESService()
  }

  async sendEmail(options: EmailServiceOptions) {
    if (options.provider == 'amazon-ses') {
      if (options.template) {
        return this.amazonSESService.sendEmail({
          to: options.to,
          subject: options.subject ?? '',
          html: options.html ?? '',
          template: options.template,
          dynamicTemplateData: options.dynamicTemplateData
        })
      }

      return this.amazonSESService.sendEmail({
        to: options.to,
        subject: options.subject ?? '',
        html: options.html ?? '',
      })
    }

    if (options.provider == 'sendgrid') {
      if (options.template) {
        return this.sendGridService.sendEmail(options.to, options.subject ?? '', options.html ?? '', options.dynamicTemplateData ?? {}, options.template)
      } else {
        return this.sendGridService.sendEmail(options.to, options.subject ?? '', options.html ?? '')
      }
    }

    return this.nodeMailerService.sendEmail({
      from: envs.MAILER_EMAIL,
      to: options.to.email,
      subject: options.subject,
      html: options.html
    })
  }
}
