import { Response } from 'express'

interface DataHandlerProps {
  /**
   * @description The response object
   */
  res: Response
  /**
   * @description The data to send
   */
  data?: any
  /**
   * @description The status code to send
   * @default 200
   * 
   * Explanation of success status codes:
   * 200: Success
   * 201: Created
   * 204: No Content
   * 
   */
  code: number
  /**
   * @description The message to send
   * @example
   * {
   *  "success": true,
   *  "message": ""
   * }
   */
  message?: string
}

export const responseHandler = ({ res, data, code, message }: DataHandlerProps) => {
  res.status(code).json({ success: true, data, message })
}
