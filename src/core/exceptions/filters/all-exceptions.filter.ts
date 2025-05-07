import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainExceptionCode } from '../domain-exception-codes';
import { ErrorResponseBody } from './error-response-body.type';

@Catch()
export class AllHttpExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unknown exception occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const responseContent = exception.getResponse();

      if (typeof responseContent === 'string') {
        message = responseContent;
      } else if (
        typeof responseContent === 'object' &&
        responseContent !== null &&
        'message' in responseContent
      ) {
        const content = responseContent as { message: string | string[] };

        if (Array.isArray(content.message)) {
          message = content.message.join(', ');
        } else {
          message = content.message;
        }
      }
    } else if (
      typeof exception === 'object' &&
      exception !== null &&
      'message' in exception
    ) {
      const ex = exception as { message: string };
      message = ex.message;
    }

    const responseBody = this.buildResponseBody(request.url, message);

    response.status(status).json(responseBody);
  }

  private buildResponseBody(
    requestUrl: string,
    message: string,
  ): ErrorResponseBody {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      timestamp: new Date().toISOString(),
      path: isProduction ? null : requestUrl,
      message: isProduction ? 'Some error occurred' : message,
      extensions: [],
      code: DomainExceptionCode.InternalServerError,
    };
  }
}
