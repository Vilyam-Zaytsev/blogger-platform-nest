import { Body, Controller, Post } from '@nestjs/common';
import { PostInputDto } from './input-dto/post-input.dto';
import { PostViewDto } from './view-dto/post-view.dto';
import { CreatePostUseCase } from '../application/usecases/create-post.usecase';
import { PostsQueryRepository } from '../infrastructure/query/posts.query-repository';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  @Post()
  async createPost(@Body() body: PostInputDto): Promise<PostViewDto> {
    const postId: string = await this.createPostUseCase.execute(body);

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
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
