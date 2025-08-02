import crypto from 'crypto';
import { readFile, unlink } from "fs/promises";
import path from 'path';
import sharp from "sharp";
import { putObject } from "../aws/s3/putObject";

interface UploadS3FilesProps {
  files: Express.Multer.File[];
  folder: string;
  bucketName: string;
}

/**
 *  
 * Note: You need to use Multer to upload files
 * 
 * @param {UploadS3FilesProps} { files, folder, bucketName }
 * @returns we return the files uploaded to S3
 */

export async function uploadS3Files({ files, folder, bucketName }: UploadS3FilesProps) {
  const fileUrls: string[] = []
  const filesResult: { fileResult: any }[] = []

  for (const file of files) {
    const randomName = crypto.randomBytes(16).toString('hex')
    const extension = path.extname(file.originalname).toLowerCase()
    const key = `${folder}/${randomName}${extension}`
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${key}`

    if (file.mimetype.includes('image')) {
      const fileBuffer = await readFile(file.path)

      const optimizedBuffer = await sharp(fileBuffer)
        .resize({ width: 1280 })
        .toFormat('jpeg', { quality: 80 })
        .toBuffer()

      const fileResult = await putObject({
        bucketName: bucketName,
        key,
        ContentType: file.mimetype,
        Body: optimizedBuffer
      })

      if (fileResult) {
        filesResult.push({ fileResult })
      }
      fileUrls.push(fileUrl)
    } else {
      const fileResult = await putObject({
        bucketName: bucketName,
        key,
        ContentType: file.mimetype,
        filePath: file.path
      })

      if (fileResult) {
        filesResult.push({ fileResult })
      }
      fileUrls.push(fileUrl)
    }

    await unlink(file.path) // eliminar después de subir
  }

  return { success: true, filesUrls: fileUrls, files: filesResult }
}