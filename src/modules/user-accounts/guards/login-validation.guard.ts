import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginInputDto } from '../api/input-dto/login.input-dto';
import { Request } from 'express';
import { errorFormatter } from '../../../setup/pipes.setup';
import { ValidationException } from '../../../core/exceptions/validation-exception';

@Injectable()
export class LoginValidationGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const dtoObject: LoginInputDto = plainToInstance(
      LoginInputDto,
      request.body,
    );
    const errors = validateSync(dtoObject, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    });

    if (errors.length > 0) {
      const errorsForResponse = errorFormatter(errors);

      throw new ValidationException(errorsForResponse);
    }

    return true;
  }
}
