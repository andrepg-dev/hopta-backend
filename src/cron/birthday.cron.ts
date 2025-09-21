// import { CronService } from '
// @/src/services/cron-jobs/cron.service'
// import Logs from '@/src/services/logs/save-logs.service'

// export const startBirthdayCron = () => {

//   // Ejecutar todos los días a las 9:00 AM
//   CronService.createJob({
//     cronTime: '0 9 * * *',
//     onTick: async () => {
//       try {
//         await birthdayService.checkAndSendBirthdayEmails()
        
//         new Logs({
//           method: 'saveLogs',
//           message: 'Birthday check completed successfully'
//         })
//       } catch (error) {-
//         new Logs({
//           method: 'saveErrorLogs',
//           message: `Error in birthday cron job: ${error}`
//         })
//       }
//     }
//   })
// } 