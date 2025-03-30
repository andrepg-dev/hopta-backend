import { BUCKET_NAME } from '@/constants/aws/s3/bucket.constants'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { deleteObject } from '@/src/services/aws/s3/deleteObject'
import { getObject } from '@/src/services/aws/s3/getObject'
import { putObject } from '@/src/services/aws/s3/putObject'
import crypto from 'crypto'
import { Request, Response, Router } from 'express'
import { readFile, unlink } from 'fs/promises'
import multer from 'multer'
import path from 'path'
import sharp from 'sharp'

const s3Router = Router()

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
    files: 20,
    fields: 1
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
}).array('file', 20)

// 🧠 Convertir multer en Promise para usar async/await
function runMulter(req: Request, res: Response): Promise<Express.Multer.File[]> {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) return reject(err)
      if (!req.files || !Array.isArray(req.files)) return reject(new Error('No files uploaded'))
      resolve(req.files)
    })
  })
}

s3Router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const objectResponse = await getObject({
      bucketName: BUCKET_NAME,
      key: 'extra-file.html'
    })
    res.send(objectResponse)
  })
)

s3Router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tempFilePaths: string[] = []

    try {
      const files = await runMulter(req, res)

      const { folder = 'default' } = req.body
      const uploadedFiles: string[] = []

      for (const file of files) {
        tempFilePaths.push(file.path)
        const randomName = crypto.randomBytes(16).toString('hex')
        const extension = path.extname(file.originalname).toLowerCase()
        const key = `${folder}/${randomName}${extension}`
        const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`

        const fileBuffer = await readFile(file.path)

        const optimizedBuffer = await sharp(fileBuffer)
          .resize({ width: 1280 })
          .toFormat('jpeg', { quality: 80 })
          .toBuffer()

        await putObject({
          bucketName: BUCKET_NAME,
          key,
          ContentType: 'image/jpeg',
          Body: optimizedBuffer
        })

        await unlink(file.path) // eliminar después de subir
        uploadedFiles.push(fileUrl)
      }

      res.send({ success: true, files: uploadedFiles })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error processing files'
      })
    }
  })
)

s3Router.delete(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const response = await deleteObject({
      bucketName: BUCKET_NAME,
      key: 'chema-alonso.jpg'
    })

    res.send({ success: true, response })
  })
)

export default s3Router
