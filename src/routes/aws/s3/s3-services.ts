import { BUCKET_NAME } from '@/constants/aws/s3/bucket.constants'
import { upload } from '@/src/config/multer.config'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { deleteObject } from '@/src/services/aws/s3/deleteObject'
import { getObject } from '@/src/services/aws/s3/getObject'
import { uploadS3Files } from '@/src/services/upload-s3-files/upload-files.service'
import { Request, Response, Router } from 'express'

const s3Router = Router()

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
    try {
      const files = await runMulter(req, res)
      const { filesUrls } = await uploadS3Files({ files, folder: 'uploads', bucketName: BUCKET_NAME })
      res.send({ success: true, filesUrls })
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
