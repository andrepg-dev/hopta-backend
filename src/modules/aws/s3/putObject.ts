import { client } from '@/constants/aws/s3/credential.constants'
import { PutObjectParams } from '@/types/aws/s3.model'
import { PutObjectCommand, S3ServiceException } from '@aws-sdk/client-s3'
import { readFile } from 'node:fs/promises'

export const putObject = async ({ bucketName, key, filePath, ...params }: PutObjectParams) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: await readFile(filePath),
    ...params
  })

  try {
    const response = await client.send(command)
    return response
  } catch (err) {
    if (err instanceof S3ServiceException && err.name === 'EntityTooLarge') {
      console.error(
        `Error from S3 while uploading object to ${bucketName}. \
The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
or the multipart upload API (5TB max).`
      )
    } else if (err instanceof S3ServiceException) {
      console.error(`Error from S3 while uploading object to ${bucketName}.  ${err.name}: ${err.message}`)
    } else {
      throw err
    }
  }
}
