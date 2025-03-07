import { client } from '@/constants/aws/s3/credential.constants'
import { AppError } from '@/src/handlers/error-handler'
import { IDeleteObjectParams } from '@/types/aws/s3.model'
import { DeleteObjectCommand, S3ServiceException, waitUntilObjectNotExists } from '@aws-sdk/client-s3'

export const deleteObject = async ({ bucketName, key, ...params }: IDeleteObjectParams) => {
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
        ...params
      })
    )
    await waitUntilObjectNotExists({ client: client, maxWaitTime: 1000 }, { Bucket: bucketName, Key: key })
    // A successful delete, or a delete for a non-existent object, both return
    // a 204 response code.
    return `The object "${key}" from bucket "${bucketName}" was deleted, or it didn't exist.`
  } catch (caught) {
    if (caught instanceof S3ServiceException && caught.name === 'NoSuchBucket') {
      throw new AppError(`Error from S3 while deleting object from ${bucketName}. The bucket doesn't exist.`, 400)
    } else if (caught instanceof S3ServiceException) {
      throw new AppError(`Error from S3 while deleting object from ${bucketName}.  ${caught.name}: ${caught.message}`, 400)
    } else {
      throw new AppError(caught, 500)
    }
  }
}
