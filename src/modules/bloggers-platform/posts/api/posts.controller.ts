import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PostInputDto } from './input-dto/post-input.dto';
import { PostViewDto } from './view-dto/post-view.dto';
import { CreatePostCommand } from '../application/usecases/create-post.usecase';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { DeletePostCommand } from '../application/usecases/delete-post.usecase';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IdInputDto } from '../../../user-accounts/api/input-dto/id.input-dto';
import { GetPostsQuery } from '../application/queries/get-posts.query-handler';
import { GetPostQuery } from '../application/queries/get-post.query-handler';
import { UpdatePostCommand } from '../application/usecases/update-post.usecase';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    return this.queryBus.execute(new GetPostsQuery(query));
  }

  @Get(':id')
  async getById(@Param() params: IdInputDto): Promise<PostViewDto> {
    return this.queryBus.execute(new GetPostQuery(params.id));
  }

  @Post()
  async createPost(@Body() body: PostInputDto): Promise<PostViewDto> {
    const postId: string = await this.commandBus.execute(
      new CreatePostCommand(body),
    );

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param() params: IdInputDto,
    @Body() body: PostInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdatePostCommand(body, params.id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param() params: IdInputDto): Promise<void> {
    await this.commandBus.execute(new DeletePostCommand(params.id));
  }
}
