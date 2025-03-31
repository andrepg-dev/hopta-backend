import { Request, Response } from 'express'
import { upload } from "../config/multer.config"

export function runMulter(req: Request, res: Response): Promise<Express.Multer.File[]> {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) return reject(err)
      if (!req.files || !Array.isArray(req.files)) return reject(new Error('No files uploaded'))
      resolve(req.files)
    })
  })
}