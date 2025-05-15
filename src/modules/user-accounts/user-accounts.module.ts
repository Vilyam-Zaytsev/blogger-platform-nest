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

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    BasicStrategy,
    UsersRepository,
    UsersQueryRepository,
    BcryptService,
    CreateUserByAdminUseCase,
    DeleteUserUseCase,
    UsersFactory,
  ],
  exports: [],
})
export class UserAccountsModule {}
