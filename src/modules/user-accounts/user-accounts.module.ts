import { Module } from '@nestjs/common';
import { UsersController } from './api/users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersRepository } from './infrastructure/users.repository';
import { User, UserSchema } from './domain/entities/user/user.entity';
import { UsersQueryRepository } from './infrastructure/query/users.query-repository';
import { BcryptService } from './application/services/bcrypt.service';
import { CreateUserByAdminUseCase } from './application/usecases/users/create-user-by-admin.usecase';
import { UsersFactory } from './application/factories/users.factory';
import { DeleteUserUseCase } from './application/usecases/users/delete-user.usecase';
import { BasicStrategy } from './guards/basic/basic.strategy';
import { AuthController } from './api/auth.controller';
import { RegisterUserUseCase } from './application/usecases/auth/register-user.useсase';
import { UserValidationService } from './application/services/user-validation.service';
import { CryptoService } from './application/services/crypto.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfirmUserUseCase } from './application/usecases/users/confirm-user.usecase';
import { ResendRegistrationEmailUseCase } from './application/usecases/auth/resend-registration-email.usecase';
import { LoginUserUseCase } from './application/usecases/auth/login-user.usecase';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constans/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { LocalStrategy } from './guards/local/local.strategy';
import { UserAccountsConfig } from './config/user-accounts.config';
import { PasswordRecoveryUseCase } from './application/usecases/auth/password-recovery.usecase';
import { NewPasswordUseCase } from './application/usecases/auth/new-password.usecase';
import { GetMeQueryHandler } from './application/queries/auth/get-me.query-handler';
import { AuthQueryRepository } from './infrastructure/query/auth.query-repository';
import { GetUsersQueryHandler } from './application/queries/users/get-users.query-handler';
import {
  Session,
  SessionSchema,
} from './domain/entities/session/session.entity';
import { SessionsController } from './api/sessions.controller';
import { CreateSessionUseCase } from './application/usecases/sessions/create-session.usecase';
import { SessionsRepository } from './infrastructure/sessions.repository';

@Module({
  imports: [
    NotificationsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [UsersController, AuthController, SessionsController],
  providers: [
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      inject: [UserAccountsConfig],

      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.accessTokenSecret,
          signOptions: {
            expiresIn: userAccountConfig.accessTokenExpireIn,
          },
        });
      },
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      inject: [UserAccountsConfig],

      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.refreshTokenSecret,
          signOptions: {
            expiresIn: userAccountConfig.refreshTokenExpireIn,
          },
        });
      },
    },
    //strategies
    JwtStrategy,
    BasicStrategy,
    LocalStrategy,
    //repo
    UsersRepository,
    UsersQueryRepository,
    SessionsRepository,
    //services
    BcryptService,
    CryptoService,
    UserValidationService,
    //use-cases
    RegisterUserUseCase,
    ResendRegistrationEmailUseCase,
    ConfirmUserUseCase,
    LoginUserUseCase,
    PasswordRecoveryUseCase,
    NewPasswordUseCase,
    CreateSessionUseCase,
    CreateUserByAdminUseCase,
    DeleteUserUseCase,
    //factories
    UsersFactory,
    //config
    UserAccountsConfig,
    //query-handlers
    GetMeQueryHandler,
    GetUsersQueryHandler,
    //repo
    AuthQueryRepository,
  ],
  exports: [BasicStrategy, UsersRepository],
})
export class UserAccountsModule {}
