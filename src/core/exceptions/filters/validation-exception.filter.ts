import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DomainException } from '../damain-exceptions';
import { ErrorValidationResponseBody } from './types/error-validate-response-body.type';
import { DomainExceptionsCodeMapper } from '../utils/domain-exceptions-code.mapper';
import { Response } from 'express';
import { ValidationException } from '../validation-exception';

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost): void {
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
