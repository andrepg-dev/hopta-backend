import { envs } from "@/constants/env.constants"
import { AppError } from "@/src/handlers/error-handler"
import sendgrid, { MailDataRequired } from "@sendgrid/mail"
import AWS from "aws-sdk"
import { SendEmailRequest } from "aws-sdk/clients/ses"
import nodemailer from "nodemailer"
import SMTPTransport from "nodemailer/lib/smtp-transport"
import { Resend } from "resend"
import Logs from "../logs/save-logs.service"

const ses = new AWS.SES({ region: process.env.AWS_REGION })

interface SendMailOptions extends nodemailer.SendMailOptions {}

const templates = {
  verification_code: "d-4c5c66eae47f47919e5d58f1b302539d",
  forgot_password: "d-4a0965ccf5e5485ba6c218202906af7b",
  contact: "d-a0f7418714bb4f9ebac4890f892d029f"
}

const templatesAmazonSES = {
  contact: "hopta-contact",
  forgot_password: "hopta-forgot-password",
  verification_code: "hopta-code-verification-v2"
}

const resendTemplates = {
  contact: "333b90c3-2bb9-46fa-8d13-bf2bc358e132",
  forgot_password: "bc6898c3-7945-4e13-930a-9203d4a4c131",
  verification_code: "f898ac5e-b489-4d9a-8f78-89fad6bf6e18"
}

class EmailServiceResend {
  private resend: Resend

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  convertKeysOjectToUpperCase(object?: Record<string, string>) {
    if (!object) return undefined

    let entries = Object.entries(object)
    let capsEntries = entries.map((entry) => [entry[0].toUpperCase(), entry[1]]) // ['KEY', value]
    return Object.fromEntries(capsEntries) // [] => {}
  }

  async sendEmail({
    to,
    subject,
    html,
    template,
    dynamicTemplateData
  }: {
    to: [string]
    subject: string
    html: string
    template?: keyof typeof resendTemplates
    dynamicTemplateData?: Record<string, string>
  }) {
    if (template) {
      console.log({ variables: this.convertKeysOjectToUpperCase(dynamicTemplateData) })

      return await this.resend.emails
        .send({
          from: `Hopta <${process.env.RESEND_FROM_EMAIL}>`,
          to,
          replyTo: "admin@hopta.hn",
          subject,
          template: {
            id: resendTemplates[template],
            variables: this.convertKeysOjectToUpperCase(dynamicTemplateData)
          }
        })
        .catch((err: unknown) => {
          throw new AppError(`Error ${err}`, 500)
        })
    }

    return await this.resend.emails
      .send({
        from: `Hopta <${process.env.RESEND_FROM_EMAIL}>`,
        to,
        replyTo: "admin@hopta.hn",
        subject,
        html
      })
      .catch((err: unknown) => {
        throw new AppError(`Error ${err}`, 500)
      })
  }
}

/**
 * @deprecated
 * Sendgrid service we need to pay to use this service, just 60 days for free trial
 *
 * @see https://sendgrid.com/
 * @see https://sendgrid.com/pricing/
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
          from: `Hopta <${process.env.SENDGRID_FROM_EMAIL}>`,
          to: { email: to.email, name: to.name ?? undefined },
          subject: subject,
          content: [
            {
              type: "text/html",
              value: html
            }
          ]
        }
      } else {
        message = {
          from: `Hopta <${process.env.SENDGRID_FROM_EMAIL}>`,
          to: { email: to.email, name: to.name ?? undefined },
          templateId: templates[template],
          dynamicTemplateData
        }
      }

      const response = await sendgrid.send(message)
      return response
    } catch (error: any) {
      new Logs({
        method: "saveErrorLogs",
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
          method: "saveLogs",
          message: sentInfo
        })

        resolve(sentInfo)
      } catch (error: any) {
        new Logs({
          method: "saveErrorLogs",
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

/**
 * Amazon SES Service
 * @deprecated
 * This is not working
 */
class EmailServiceAmazonSESService {
  async sendEmail({ to, subject, html, template, dynamicTemplateData }: SendEmailAmazonSESOptions) {
    // Sending message with template
    if (template) {
      const params: AWS.SES.SendTemplatedEmailRequest = {
        Source: `Hopta <${process.env.AWS_FROM_EMAIL}>`,
        Destination: {
          ToAddresses: [to.email]
        },
        // Using AWS SES TEMPLATES
        Template: templatesAmazonSES[template],
        TemplateData: JSON.stringify(dynamicTemplateData),
        ConfigurationSetName: "my-first-configuration-set",
        Tags: [
          {
            Name: "source",
            Value: "hopta-admin"
          }
        ]
      }

      try {
        const result = await ses.sendTemplatedEmail(params).promise()
        console.log(result)
        return result
      } catch (error) {
        console.error("Error sending email with Amazon SES:", error)
        throw new AppError("Failed to send email with Amazon SES", 500)
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
            Charset: "UTF-8",
            Data: html
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject
        }
      },
      Source: `Hopta <${process.env.AWS_FROM_EMAIL}>`
    }

    try {
      const result = await ses.sendEmail(params).promise()
      console.log(result)
      return result
    } catch (error) {
      console.error("Error sending email with Amazon SES:", error)
      throw new AppError("Failed to send email with Amazon SES", 500)
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
  template?: keyof typeof templates | keyof typeof templatesAmazonSES | undefined
  provider: "sendgrid" | "nodemailer" | "amazon-ses" | "resend"
}

export class EmailService {
  private sendGridService: EmailServiceSendGrid
  private nodeMailerService: EmailServiceNodeMailer
  private amazonSESService: EmailServiceAmazonSESService
  private resendService: EmailServiceResend

  constructor() {
    this.sendGridService = new EmailServiceSendGrid()
    this.nodeMailerService = new EmailServiceNodeMailer()
    this.amazonSESService = new EmailServiceAmazonSESService()
    this.resendService = new EmailServiceResend()
  }

  /**
   * Send email service
   * @param options
   * @returns
   */
  async sendEmail(options: EmailServiceOptions) {
    if (options.provider == "amazon-ses") {
      if (options.template) {
        return this.amazonSESService.sendEmail({
          to: options.to,
          subject: options.subject ?? "",
          html: options.html ?? "",
          template: options.template,
          dynamicTemplateData: options.dynamicTemplateData
        })
      }

      return this.amazonSESService.sendEmail({
        to: options.to,
        subject: options.subject ?? "",
        html: options.html ?? ""
      })
    }

    if (options.provider == "sendgrid") {
      if (options.template) {
        return this.sendGridService.sendEmail(options.to, options.subject ?? "", options.html ?? "", options.dynamicTemplateData ?? {}, options.template)
      } else {
        return this.sendGridService.sendEmail(options.to, options.subject ?? "", options.html ?? "")
      }
    }

    if (options.provider == "resend") {
      if (options.template) {
        return this.resendService.sendEmail({
          to: [options.to.email],
          subject: options.subject ?? "",
          html: options.html ?? "",
          template: options.template,
          dynamicTemplateData: options.dynamicTemplateData
        })
      }

      // No template
      if (!options.template) {
        return this.resendService.sendEmail({
          to: [options.to.email],
          subject: options.subject ?? "",
          html: options.html ?? ""
        })
      }
    }

    return this.nodeMailerService.sendEmail({
      from: `Hopta <${envs.MAILER_EMAIL}>`,
      to: options.to.email,
      subject: options.subject,
      html: options.html
    })
  }
}
