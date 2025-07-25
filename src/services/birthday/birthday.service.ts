import { userModel } from '@/src/schemas/user.schemas'
import { EmailService } from '../email/email.service'
import Logs from '../logs/save-logs.service'

export class BirthdayService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  private isBirthday(date: Date): boolean {
    const today = new Date()
    return date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
  }

  async checkAndSendBirthdayEmails() {
    try {
      // Obtener todos los usuarios que tienen fecha de nacimiento
      const users = await userModel.find({
        'personal_information.birth_date': { $exists: true }
      })

      for (const user of users) {
        const birthDate = new Date(user.personal_information?.birth_date as string)

        if (this.isBirthday(birthDate)) {
          // Enviar email de felicitación
          await this.emailService.sendEmail({
            to: {
              email: user.email,
              name: `${user.name} ${user.last_name}`
            },
            provider: 'sendgrid',
            template: 'birthday',
            dynamicTemplateData: {
              name: `${user.name} ${user.last_name}`,
              email: user.email
            }
          })

          new Logs({
            method: 'saveLogs',
            message: `Birthday email sent to ${user.email}`
          })
        }
      }
    } catch (error) {
      new Logs({
        method: 'saveErrorLogs',
        message: `Error sending birthday emails: ${error}`
      })
      throw error
    }
  }
} 