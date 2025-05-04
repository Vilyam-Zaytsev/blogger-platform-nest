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
import { BlogInputDto } from './input-dto/blog-input.dto';
import { BlogViewDto } from './view-dto/blog-view.dto';
import { CreateBlogUseCase } from '../application/usecases/create-blog.usecase';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { UpdateBlogUseCase } from '../application/usecases/update-blog.usecase';
import { DeleteBlogUseCase } from '../application/usecases/delete-blog.usecase';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { PostViewDto } from '../../posts/api/view-dto/post-view.dto';
import { CreatePostUseCase } from '../../posts/application/usecases/create-post.usecase';
import { CreatePostDto } from '../../posts/dto/post.dto';
import { CreatePostForBlogInputDto } from '../../posts/api/input-dto/create-post-for-blog-input.dto';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly createBlogUseCase: CreateBlogUseCase,
    private readonly updateBlogUseCase: UpdateBlogUseCase,
    private readonly deleteBlogUseCase: DeleteBlogUseCase,
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}
  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  // TODO: Корректно ли реализовано получение постов для блога (особенно проверка наличия блога)?
  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId') blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);

    return this.postsQueryRepository.getAll(query);
  }

  @Post()
  async createBlog(@Body() body: BlogInputDto): Promise<BlogViewDto> {
    const blogId: string = await this.createBlogUseCase.execute(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }
  // TODO: Корректно ли реализовано создание поста для блога (особенно проверка наличия блога)?

  @Post(':blogId/posts')
  async createPostForBlog(
    @Param('blogId') blogId: string,
    @Body() body: CreatePostForBlogInputDto,
  ): Promise<PostViewDto> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);

    const createPostDto: CreatePostDto = {
      ...body,
      blogId,
    };

    const postId: string = await this.createPostUseCase.execute(createPostDto);

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param('id') id: string,
    @Body() body: BlogInputDto,
  ): Promise<void> {
    await this.updateBlogUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param('id') id: string): Promise<void> {
    await this.deleteBlogUseCase.execute(id);
  }
}
