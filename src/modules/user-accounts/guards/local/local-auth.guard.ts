import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { LoginInputDto } from '../../api/input-dto/authentication-authorization/login.input-dto';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { errorFormatter } from '../../../../setup/pipes.setup';
import { ValidationException } from '../../../../core/exceptions/validation-exception';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    return super.canActivate(context) as boolean;
  }
}
