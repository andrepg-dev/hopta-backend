import { GetObjectCommandInput, PutObjectCommandInput } from '@aws-sdk/client-s3'

export interface IS3Base {
  bucketName: string
  key: string
}

export interface PutObjectParams extends Omit<PutObjectCommandInput, 'Bucket' | 'Key'>, IS3Base {
  filePath?: string
}
export interface IGetObjectParams extends IS3Base, Omit<GetObjectCommandInput, 'Bucket' | 'Key'> {}
export interface IDeleteObjectParams extends IS3Base, Omit<GetObjectCommandInput, 'Bucket' | 'Key'> {}
