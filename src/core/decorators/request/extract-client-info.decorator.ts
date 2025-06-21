import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClientInfoDto } from '../../dto/client-info.dto';
import { Request } from 'express';

export const ExtractClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ClientInfoDto => {
    const request: Request = ctx.switchToHttp().getRequest();

    const userAgent: string = request.headers['user-agent'] || '';
    const ip: string =
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.socket.remoteAddress ||
      '0.0.0.0';

    return {
      ip,
      userAgent,
    };
  },
);
