import { client } from '@/constants/aws/s3/credential'
import { IGetObjectParams } from '@/types/aws/s3.model'
import { GetObjectCommand, NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3'

export const getObject = async ({ bucketName, key, ...params }: IGetObjectParams) => {
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
        ...params
      })
    )
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const str = await response.Body?.transformToString()

    return str
  } catch (caught) {
    if (caught instanceof NoSuchKey) {
      console.error(`Error from S3 while getting object "${key}" from "${bucketName}". No such key exists.`)
    } else if (caught instanceof S3ServiceException) {
      console.error(`Error from S3 while getting object from ${bucketName}.  ${caught.name}: ${caught.message}`)
    } else {
      throw caught
    }
  }
}
