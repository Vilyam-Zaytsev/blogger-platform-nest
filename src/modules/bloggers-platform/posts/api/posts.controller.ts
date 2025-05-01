import { Body, Controller, Post } from '@nestjs/common';
import { BlogViewDto } from '../../blogs/api/view-dto/blog-view.dto';
import { PostInputDto } from './input-dto/post-input.dto';
import { PostViewDto } from './view-dto/post-view.dto';

@Controller('posts')
export class PostsController {
  constructor() {} // private readonly blogsQueryRepository: BlogsQueryRepository, // private readonly deleteBlogUseCase: DeleteBlogUseCase, // private readonly updateBlogUseCase: UpdateBlogUseCase, // private readonly createBlogUseCase: CreateBlogUseCase,
  // @Get()
  // async getAll(
  //   @Query() query: GetBlogsQueryParams,
  // ): Promise<PaginatedViewDto<BlogViewDto>> {
  //   return this.blogsQueryRepository.getAll(query);
  // }

  // @Get(':id')
  // async getById(@Param('id') id: string): Promise<BlogViewDto> {
  //   return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  // }

  @Post()
  async createPost(@Body() body: PostInputDto): Promise<PostViewDto> {
    const postId: string = await this.createBlogUseCase.execute(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }

  // @Put(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async updateBlog(
  //   @Param('id') id: string,
  //   @Body() body: BlogInputDto,
  // ): Promise<void> {
  //   await this.updateBlogUseCase.execute(id, body);
  // }
  //
  // @Delete(':id')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deleteBlog(@Param('id') id: string): Promise<void> {
  //   await this.deleteBlogUseCase.execute(id);
  // }
}
