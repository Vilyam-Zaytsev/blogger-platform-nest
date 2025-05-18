import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersRepository } from './infrastructure/users.repository';
import { User, UserSchema } from './domain/user.entity';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { BcryptService } from './application/bcrypt.service';
import { CreateUserByAdminUseCase } from './application/usecases/create-user-by-admin.usecase';
import { UsersFactory } from './application/users.factory';
import { DeleteUserUseCase } from './application/usecases/delete-user.usecase';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { AuthController } from './api/auth.controller';
import { RegisterUserUseCase } from './application/usecases/register-user.useсase';
import { UserValidationService } from './application/user-validation.service';
import { CryptoService } from './application/crypto.service';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfirmUserUseCase } from './application/usecases/confirm-user.usecase';
import { ResendRegistrationEmailUseCase } from './application/usecases/resend-registration-email.usecase';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { configModule } from '../../config/dynamic-config.module';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { LocalStrategy } from './guards/local/local.strategy';

@Module({
  imports: [
    configModule,
    CqrsModule,
    NotificationsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, AuthController],
  providers: [
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (configService: ConfigService): JwtService => {
        return new JwtService({
          secret: configService.get<string>('JWT_SECRET_AT'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION_AT'),
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (configService: ConfigService): JwtService => {
        return new JwtService({
          secret: configService.get<string>('JWT_SECRET_RT'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION_RT'),
          },
        });
      },
      inject: [ConfigService],
    },
    BasicStrategy,
    LocalStrategy,
    UsersRepository,
    UsersQueryRepository,
    BcryptService,
    UserValidationService,
    CreateUserByAdminUseCase,
    RegisterUserUseCase,
    ConfirmUserUseCase,
    ResendRegistrationEmailUseCase,
    LoginUserUseCase,
    DeleteUserUseCase,
    UsersFactory,
    CryptoService,
    JwtStrategy,
  ],
  exports: [],
})
export class UserAccountsModule {}
