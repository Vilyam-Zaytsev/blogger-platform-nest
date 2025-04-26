import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UriParamId } from '../../../core/types/input-types';
import { UsersInputDto } from './input-dto/users.input-dto';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { CreateUserByAdminUseCase } from '../application/usecases/create-user-by-admin.usecase';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserByAdminUseCase: CreateUserByAdminUseCase,
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  @Get()
  async getUsers(@Query() query: any) {}

  @Post()
  async createUser(@Body() body: UsersInputDto) {
    const userId: string = await this.createUserByAdminUseCase.execute(body);

    return this.usersQueryRepository.getUserById(userId);
  }

  @Delete(':id')
  async deleteUser(@Param('id') params: UriParamId) {}
}
