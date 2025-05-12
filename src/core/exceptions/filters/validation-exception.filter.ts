import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DomainException } from '../damain-exceptions';
import { DomainExceptionCode } from '../domain-exception-codes';
import { ErrorValidationResponseBody } from './types/error-validate-response-body.type';
import { DomainExceptionsCodeMapper } from '../utils/domain-exceptions-code.mapper';
import { Response } from 'express';

@Catch(DomainException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
    if (exception.code !== DomainExceptionCode.ValidationError) {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status: number = DomainExceptionsCodeMapper.mapToHttpStatus(
      exception.code,
    );
    const responseBody: ErrorValidationResponseBody = {
      errorsMessages: [...exception.extensions],
    };

    response.status(status).json(responseBody);
  }
}
