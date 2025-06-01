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
  UseGuards,
} from '@nestjs/common';
import { BlogInputDto } from './input-dto/blog-input.dto';
import { BlogViewDto } from './view-dto/blog-view.dto';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecase';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { PaginatedViewDto } from '../../../../core/dto/paginated.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecase';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecase';
import { GetPostsQueryParams } from '../../posts/api/input-dto/get-posts-query-params.input-dto';
import { PostsQueryRepository } from '../../posts/infrastructure/query/posts.query-repository';
import { PostViewDto } from '../../posts/api/view-dto/post-view.dto';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecase';
import { CreatePostDto } from '../../posts/dto/post.dto';
import { CreatePostForBlogInputDto } from '../../posts/api/input-dto/create-post-for-blog-input.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IdInputDto } from '../../../user-accounts/api/input-dto/id.input-dto';
import { GetBlogQuery } from '../application/queries/get-blog.query-handler';
import { GetBlogsQuery } from '../application/queries/get-blogs.query-handler';
import { GetPostsForBlogQuery } from '../application/queries/get-posts-for-blog.query-handler';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-pipe';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { async } from 'rxjs';
import { Public } from '../../../user-accounts/decorators/public.decorator';

@Controller('blogs')
@UseGuards(BasicAuthGuard)
export class BlogsController {
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  @Get()
  @Public()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDto>> {
    return this.queryBus.execute(new GetBlogsQuery(query));
  }

  @Get(':id')
  @Public()
  async getById(@Param() params: IdInputDto): Promise<BlogViewDto> {
    return this.queryBus.execute(new GetBlogQuery(params.id));
  }

  @Get(':blogId/posts')
  @Public()
  async getPostsForBlog(
    @Param('blogId', ObjectIdValidationPipe) blogId: string,
    @Query() query: GetPostsQueryParams,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    return this.queryBus.execute(new GetPostsForBlogQuery(query, blogId));
  }

  @Post()
  async createBlog(@Body() body: BlogInputDto): Promise<BlogViewDto> {
    const blogId: string = await this.commandBus.execute(
      new CreateBlogCommand(body),
    );

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  @Post(':blogId/posts')
  async createPostForBlog(
    @Param('blogId', ObjectIdValidationPipe) blogId: string,
    @Body() body: CreatePostForBlogInputDto,
  ): Promise<PostViewDto> {
    const createPostDto: CreatePostDto = {
      ...body,
      blogId,
    };

    const postId: string = await this.commandBus.execute(
      new CreatePostCommand(createPostDto),
    );

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param() params: IdInputDto,
    @Body() body: BlogInputDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateBlogCommand(body, params.id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param() params: IdInputDto): Promise<void> {
    await this.commandBus.execute(new DeleteBlogCommand(params.id));
  }
}
