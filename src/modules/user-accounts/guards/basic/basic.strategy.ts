import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  validate(username: string, password: string): boolean {
    const validUsername: string | undefined =
      this.configService.get<string>('ADMIN_LOGIN');

    const validPassword: string | undefined =
      this.configService.get<string>('ADMIN_PASSWORD');

    if (username === validUsername && password === validPassword) {
      return true;
    }
    throw new Error("The administrator's credentials were not verified");
  }
}
