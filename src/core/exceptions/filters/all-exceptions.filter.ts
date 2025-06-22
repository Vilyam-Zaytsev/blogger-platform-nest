import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseBody } from './types/error-response-body.type';
import { DomainExceptionCode } from '../domain-exception-codes';
import { CoreConfig } from '../../core.config';

@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
  constructor(private readonly coreConfig: CoreConfig) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const message: string = exception.message || 'Unknown exception occurred.';
    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception instanceof HttpException) status = exception.getStatus();
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
    if (!this.coreConfig.sendInternalServerErrorDetails) {
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
