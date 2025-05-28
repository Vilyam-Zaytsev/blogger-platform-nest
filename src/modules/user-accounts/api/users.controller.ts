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
  UseGuards,
} from '@nestjs/common';
import { UserInputDto } from './input-dto/user.input-dto';
import { UsersQueryRepository } from '../infrastructure/query/users.query-repository';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../core/dto/paginated.view-dto';
import { UserViewDto } from './view-dto/user.view-dto';
import { DeleteUserUseCase } from '../application/usecases/delete-user.usecase';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { IdInputDto } from './input-dto/id.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetUsersQuery } from '../application/queries/users/get-users.query-handler';
import { CreateUserCommand } from '../application/usecases/create-user-by-admin.usecase';

@Controller('users')
@UseGuards(BasicAuthGuard)
export class UsersController {
  constructor(
    private readonly deleteUserByAdminUseCase: DeleteUserUseCase,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto>> {
    return this.queryBus.execute(new GetUsersQuery(query));
  }

  @Post()
  async createUser(@Body() body: UserInputDto): Promise<UserViewDto> {
    const userId: string = await this.commandBus.execute(
      new CreateUserCommand(body),
    );

    return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param() id: IdInputDto): Promise<void> {
    await this.deleteUserByAdminUseCase.execute(id.id);
  }
}
