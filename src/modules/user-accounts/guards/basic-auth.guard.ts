import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { parseBasicAuth } from '../../../core/utils/basic-auth.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  private readonly validUsername: string;
  private readonly validPassword: string;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    //TODO: уточнить на уроке какй метод определения validUsername и validPassword предпочтительнее.

    //вариант 1
    // this.validUsername = this.configService.get<string>('VALID_USERNAME', 'admin');
    // this.validPassword = this.configService.get<string>('VALID_PASSWORD', 'qwerty');

    //вариант 2
    const username = this.configService.get<string>('ADMIN_LOGIN');
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    //TODO: уточнить на уроке(как лучше выбросить исключение?).
    if (!username || !password) {
      throw new Error(
        'ADMIN_LOGIN and ADMIN_PASSWORD must be set in environment variables',
      );
    }

    this.validUsername = username;
    this.validPassword = password;
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic: boolean = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader: string | undefined = request.headers.authorization;

    let username: string;
    let password: string;

    try {
      [username, password] = parseBasicAuth(authHeader);
    } catch (error) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised',
      });
    }

    if (username !== this.validUsername || password !== this.validPassword) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'unauthorised',
      });
    }

    return true;
  }
}
