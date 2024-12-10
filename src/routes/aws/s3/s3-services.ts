import { BUCKET_NAME } from '@/constants/aws/s3/bucket';
import asyncHandler from '@/src/helpers/try-catch-async-handler';
import { deleteObject } from '@/src/modules/aws/s3/deleteObject';
import { getObject } from '@/src/modules/aws/s3/getObject';
import { putObject } from '@/src/modules/aws/s3/putObject';
import { Request, Response, Router } from 'express';

const s3Router = Router()

s3Router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const objectResponse = await getObject({
    bucketName: BUCKET_NAME,
    key: 'extra-file.html',
  })

  res.send(objectResponse)
}))

s3Router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const response = await putObject({
    bucketName: BUCKET_NAME,
    key: 'chema-alonso.jpg',
    filePath: __dirname + '/chema-alonso.jpg',
  })

  res.send({ success: true, response })
}))

s3Router.delete('/', asyncHandler(async (req: Request, res: Response) => {
  const response = await deleteObject({
    bucketName: BUCKET_NAME,
    key: 'chema-alonso.jpg',
  })

  res.send({ success: true, response })
}));

export default s3Router

