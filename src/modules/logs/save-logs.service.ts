import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

class Logs {
  private paths = {
    app: 'logs/app-%DATE%.log',
    error: 'logs/error-%DATE%.log'
  }

  private logs_configuration = {
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
  }


  constructor({ method, message = 'saveLogs'}: { method?: 'saveLogs' | 'saveErrorLogs', message: any }) {
    if (method === 'saveLogs') {
      this.saveLogs().info(message)
    } else if (method === 'saveErrorLogs') {
      this.saveLogs().error(message)
    }
  }

  private saveLogs() {
    return winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        // Console
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), winston.format.simple())
        }),

        // Log in rotation
        new DailyRotateFile({
          level: 'info',
          filename: this.paths.app,
          datePattern: this.logs_configuration.datePattern,
          zippedArchive: this.logs_configuration.zippedArchive,
          maxSize: this.logs_configuration.maxSize,
          maxFiles: this.logs_configuration.maxFiles
        }),

        // Log in files with errors
        new DailyRotateFile({
          level: 'error',
          filename: this.paths.error,
          datePattern: this.logs_configuration.datePattern,
          zippedArchive: this.logs_configuration.zippedArchive,
          maxSize: this.logs_configuration.maxSize,
          maxFiles: this.logs_configuration.maxFiles
        })
      ]
    })
  }
}

export default Logs
