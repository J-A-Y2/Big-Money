import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common'
import { Request, Response } from 'express'

interface CustomHttpExceptionResponse {
  statusCode: number
  error?: string
  message: string | string[]
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception.getStatus()
    const errorResponse = exception.getResponse()

    let message: string | string[]
    let error: string | undefined

    if (typeof errorResponse === 'string') {
      message = errorResponse
    } else {
      const customResponse = errorResponse as CustomHttpExceptionResponse
      message = customResponse.message
      error = customResponse.error
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: error || null,
    })
  }
}
