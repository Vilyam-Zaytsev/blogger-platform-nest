import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseBody } from './error-response-body.type';
import { DomainExceptionCode } from '../domain-exception-codes';

@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
  catch(exception: { message?: string }, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const message: string = exception.message || 'Unknown exception occurred.';
    const status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody: ErrorResponseBody = this.buildResponseBody(
      request.url,
      message,
    );

    response.status(status).json(responseBody);
  }

  private buildResponseBody(
    requestUrl: string,
    message: string,
  ): ErrorResponseBody {
    //TODO: Replace with getter from configService. will be in the following lessons
    const isProduction: boolean = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return {
        timestamp: new Date().toISOString(),
        path: null,
        message: 'Some error occurred',
        extensions: [],
        code: DomainExceptionCode.InternalServerError,
      };
    }

    return {
      timestamp: new Date().toISOString(),
      path: requestUrl,
      message,
      extensions: [],
      code: DomainExceptionCode.InternalServerError,
    };
  }
}
