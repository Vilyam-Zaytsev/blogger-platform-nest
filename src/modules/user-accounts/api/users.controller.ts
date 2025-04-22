import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UriParamId } from '../../../core/types/input-types';
import { UsersInputDto } from './input-dto/users.input-dto';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private usersService: UsersService,
  ) {}
  @Get()
  async getUsers(@Query() query: any) {}

  @Post()
  async createUser(@Body() body: UsersInputDto) {
    const { email, login, password } = body;

    const newUserDto: CreateUserDto = {
      email,
      login,
      password,
      isConfirmed: true,
    };

    const userId: string = await this.usersService.createUser(newUserDto);

    return this.usersQueryRepository.getUserById(userId);
  }

  @Delete(':id')
  async deleteUser(@Param('id') params: UriParamId) {}
}
