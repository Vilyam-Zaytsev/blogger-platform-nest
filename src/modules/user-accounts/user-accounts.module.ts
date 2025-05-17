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

@Module({
  imports: [
    CqrsModule,
    NotificationsModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, AuthController],
  providers: [
    BasicStrategy,
    UsersRepository,
    UsersQueryRepository,
    BcryptService,
    UserValidationService,
    CreateUserByAdminUseCase,
    RegisterUserUseCase,
    DeleteUserUseCase,
    UsersFactory,
    CryptoService,
  ],
  exports: [],
})
export class UserAccountsModule {}
