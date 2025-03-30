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
    files: 1,
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
}).single('file')

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
    let tempFilePath: string | null = null;

    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: err.message
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          error: 'Error processing file'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      tempFilePath = req.file.path;
      const { mimetype } = req.file;
      const { folder = 'default' } = req.body;

      // Generate random name for file
      const randomName = crypto.randomBytes(16).toString('hex');
      const extension = path.extname(req.file.originalname).toLowerCase();
      const key = `${folder}/${randomName}${extension}`;

      const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

      await putObject({ // Upload file to S3
        bucketName: BUCKET_NAME,
        key,
        filePath: tempFilePath,
        ContentType: mimetype
      });

      res.send({ success: true, file: fileUrl });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error processing file'
      });
    } finally {
      if (tempFilePath && fs.existsSync(tempFilePath)) { // Delete temp file
        fs.unlinkSync(tempFilePath);
      }
    }
  });
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
