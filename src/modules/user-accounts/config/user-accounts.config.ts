import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../../core/utils/config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({
    message: 'Set Env variable JWT_EXPIRATION_AT, examples: 1h, 5m, 2d',
  })
  accessTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable JWT_EXPIRATION_RT, examples: 1h, 5m, 2d',
  })
  refreshTokenExpireIn: string;

  @IsNotEmpty({
    message: 'Set Env variable JWT_SECRET_AT, dangerous for security!',
  })
  accessTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable JWT_SECRET_RT, dangerous for security!',
  })
  refreshTokenSecret: string;

  constructor(private configService: ConfigService<any, true>) {
    this.accessTokenExpireIn = this.configService.get('JWT_EXPIRATION_AT');

    this.refreshTokenExpireIn = this.configService.get('JWT_EXPIRATION_RT');

    this.accessTokenSecret = this.configService.get('JWT_SECRET_AT');

    this.refreshTokenSecret = this.configService.get('JWT_SECRET_RT');

    configValidationUtility.validateConfig(this);
  }
}
