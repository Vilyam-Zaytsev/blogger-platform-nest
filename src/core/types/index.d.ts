import { UserContextDto } from '../../modules/user-accounts/guards/dto/user-context.dto';

declare module 'express' {
  interface Request {
    user?: UserContextDto;
  }
}
