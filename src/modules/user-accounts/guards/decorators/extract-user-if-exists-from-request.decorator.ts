import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from '../dto/user-context.dto';
import { Request } from 'express';

export const ExtractUserIfExistsFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto | null => {
    const request: Request = context.switchToHttp().getRequest<Request>();

    const user = request.user;
    if (!user) {
      return null;
    }

    return user as UserContextDto;
  },
);
