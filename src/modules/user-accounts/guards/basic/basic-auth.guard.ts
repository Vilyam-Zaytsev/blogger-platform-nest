import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { parseBasicAuth } from '../../../../core/utils/basic-auth.utility';
import { BasicStrategy } from './basic.strategy';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(
    private readonly strategy: BasicStrategy,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader: string | undefined = request.headers.authorization;

    let username: string;
    let password: string;

    try {
      [username, password] = parseBasicAuth(authHeader);

      this.strategy.validate(username, password);

      return true;
    } catch (error) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised',
      });
    }
  }
}
