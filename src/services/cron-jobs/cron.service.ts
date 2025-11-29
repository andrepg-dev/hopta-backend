import { CronJob } from "cron"

interface createJobProps {
  cronTime: string
  onTick: () => void
}

export class CronService {
  static createJob({ cronTime, onTick }: createJobProps) {
    const job = new CronJob(cronTime, onTick)
    job.start()
    return job
  }
}
