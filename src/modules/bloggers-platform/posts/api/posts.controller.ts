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
import { CreatePostUseCase } from '../application/usecases/create-post.usecase';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { GetPostsQueryParams } from './input-dto/get-posts-query-params.input-dto';
import { UpdatePostUseCase } from '../application/usecases/update-post.usecase';
import { DeletePostUseCase } from '../application/usecases/delete-post.usecase';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}
  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    return this.postsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<PostViewDto> {
    return this.postsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Post()
  async createPost(@Body() body: PostInputDto): Promise<PostViewDto> {
    const postId: string = await this.createPostUseCase.execute(body);

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('id') id: string,
    @Body() body: PostInputDto,
  ): Promise<void> {
    await this.updatePostUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.deletePostUseCase.execute(id);
  }
}
