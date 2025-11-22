import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../response/api.response';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Something went wrong';
    let errors: string | string[] | undefined = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle string responses
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
      // Handle object responses
      else if (typeof exceptionResponse === 'object') {
        if ('message' in exceptionResponse) {
          message = exceptionResponse.message as string;
        }
        if ('errors' in exceptionResponse) {
          errors = exceptionResponse.errors as string | string[];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log errors for 500 level errors
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${statusCode} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${statusCode} - ${message}`);
    }

    // Build response object
    const responseBody = ApiResponse.error(message, errors);
    response.status(statusCode).json(responseBody);
  }
}
