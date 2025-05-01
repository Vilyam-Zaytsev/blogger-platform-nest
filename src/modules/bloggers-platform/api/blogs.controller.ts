import { Body, Controller, Post } from '@nestjs/common';
import { BlogsInputDto } from './input-dto/blogs.input-dto';
import { BlogsViewDto } from './view-dto/blogs.view-dto';
import { CreateBlogUseCase } from '../application/usecases/create-blog.usecase';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly createBlogUseCase: CreateBlogUseCase,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}
  @Post()
  async createBlog(@Body() body: BlogsInputDto): Promise<BlogsViewDto> {
    const blogId: string = await this.createBlogUseCase.execute(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }
}
