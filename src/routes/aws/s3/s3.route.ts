import { BUCKET_NAME } from "@/constants/aws/s3/bucket.constants"
import asyncHandler from "@/src/actions/try-catch-async-handler"
import { multerConfig } from "@/src/config/multer.config"
import { AppError } from "@/src/handlers/error-handler"
import { responseHandler } from "@/src/handlers/responseHandler"
import { deleteObject } from "@/src/services/aws/s3/deleteObject"
import { uploadS3Files } from "@/src/services/upload-s3-files/upload-files.service"
import { Request, Response, Router } from "express"
const s3UploadImageRouter = Router()

s3UploadImageRouter.post(
  "/",
  multerConfig({ propName: "images", maxFiles: 35 }),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // get files from request
      const files = req.files as Express.Multer.File[]
      if (!files) throw new AppError("No files uploaded", 400)

      // upload files to s3
      const { filesUrls } = await uploadS3Files({ files: files, folder: "images", bucketName: BUCKET_NAME })
      if (!filesUrls) throw new AppError("Error uploading files", 500)

      responseHandler({
        res,
        code: 200,
        data: { filesUrls }
      })
    } catch (error) {
      console.error(error)
      throw new AppError(error instanceof Error ? error.message : "Error processing files", 500)
    }
  })
)

s3UploadImageRouter.delete(
  "/:key",
  asyncHandler(async (req: Request, res: Response) => {
    const rawKey = req.params.key
    const key: string = (Array.isArray(rawKey) ? rawKey[0] : rawKey) ?? ""

    const response = await deleteObject({
      bucketName: BUCKET_NAME,
      key
    })

    responseHandler({
      res,
      code: 200,
      data: { response }
    })
  })
)

export default s3UploadImageRouter
