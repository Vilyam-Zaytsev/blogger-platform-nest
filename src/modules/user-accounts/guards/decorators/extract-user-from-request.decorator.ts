import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';
import { Request } from 'express';

export const ExtractUserFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto => {
    const request: Request = context.switchToHttp().getRequest<Request>();

    const user = request.user;
    if (!user) {
      throw new Error('There is no user information in the request object');
    }

    return user as UserContextDto;
  },
);
