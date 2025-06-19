import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionContextDto } from '../dto/session-context.dto';
import { Request } from 'express';

export const ExtractSessionFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): SessionContextDto => {
    const request: Request = context.switchToHttp().getRequest<Request>();

    const session = request.user;

    if (!session) {
      throw new Error('There is no user information in the request object');
    }

    return session as SessionContextDto;
  },
);
