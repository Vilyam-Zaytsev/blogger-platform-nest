import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserValidationService } from '../../application/user-validation.service';
import { UserContextDto } from '../dto/user-context.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userValidationService: UserValidationService) {
    super({ usernameField: 'loginOrEmail' });
  }

  async validate(username: string, password: string): Promise<UserContextDto> {
    return await this.userValidationService.authenticateUser(
      username,
      password,
    );
  }
}
