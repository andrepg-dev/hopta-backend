import { BUCKET_NAME } from '@/constants/aws/s3/bucket.constants'
import asyncHandler from '@/src/helpers/try-catch-async-handler'
import { deleteObject } from '@/src/services/aws/s3/deleteObject'
import { getObject } from '@/src/services/aws/s3/getObject'
import { putObject } from '@/src/services/aws/s3/putObject'
import crypto from 'crypto'
import { Request, Response, Router } from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'

const s3Router = Router()

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB,
    files: 20,
    fields: 1
  },
  fileFilter: (_req, file, cb) => {
    // Allowed mimes
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
}).array('file', 20)

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

s3Router.post('/', async (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    const tempFilePaths: string[] = []

    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          error: 'Error processing files'
        });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const { folder = 'default' } = req.body
      const uploadedFiles = []

      for (const file of req.files) {
        tempFilePaths.push(file.path)
        const randomName = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname).toLowerCase();
        const key = `${folder}/${randomName}${extension}`;
        const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

        await putObject({
          bucketName: BUCKET_NAME,
          key,
          filePath: file.path,
          ContentType: file.mimetype
        });

        uploadedFiles.push(fileUrl);
      }

      res.send({
        success: true,
        files: uploadedFiles
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error processing files'
      });
    } finally {
      // Limpiar todos los archivos temporales
      for (const tempPath of tempFilePaths) {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }
  })
})

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
