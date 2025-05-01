import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserInputDto } from './input-dto/user.input-dto';
import { UsersService } from '../application/users.service';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { CreateUserByAdminUseCase } from '../application/usecases/create-user-by-admin.usecase';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/paginated.view-dto';
import { UserViewDto } from './view-dto/user.view-dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserByAdminUseCase: CreateUserByAdminUseCase,
    private readonly usersService: UsersService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto>> {
    return this.usersQueryRepository.getAll(query);
  }

  @Post()
  async createUser(@Body() body: UserInputDto): Promise<UserViewDto> {
    const userId: string = await this.createUserByAdminUseCase.execute(body);

    return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.usersService.deleteUser(id);
  }
}
