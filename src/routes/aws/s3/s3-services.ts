import { BUCKET_NAME } from '@/constants/aws/s3/bucket.constants'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { deleteObject } from '@/src/services/aws/s3/deleteObject'
import { getObject } from '@/src/services/aws/s3/getObject'
import { uploadS3Files } from '@/src/services/upload-s3-files/upload-files.service'
import { runMulter } from '@/src/utils/run-multer.utils'
import { Request, Response, Router } from 'express'
import { responseHandler } from '@/src/handlers/responseHandler'
import { AppError } from '@/src/handlers/error-handler'

const s3Router = Router()

s3Router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const objectResponse = await getObject({
      bucketName: BUCKET_NAME,
      key: 'extra-file.html'
    })
    responseHandler({
      res,
      code: 200,
      data: objectResponse
    })
  })
)

s3Router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const files = await runMulter(req, res)
      const { filesUrls } = await uploadS3Files({ files, folder: 'uploads', bucketName: BUCKET_NAME })
      responseHandler({
        res,
        code: 200,
        data: { filesUrls }
      })
    } catch (error) {
      console.error(error)
      throw new AppError(error instanceof Error ? error.message : 'Error processing files', 500)
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

    responseHandler({
      res,
      code: 200,
      data: { response }
    })
  })
)

export default s3Router
