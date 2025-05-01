import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BlogsInputDto } from './input-dto/blogs.input-dto';
import { BlogsViewDto } from './view-dto/blogs.view-dto';
import { CreateBlogUseCase } from '../application/usecases/create-blog.usecase';
import { BlogsQueryRepository } from '../infrastructure/query/blogs.query-repository';
import { PaginatedViewDto } from '../../../core/dto/paginated.view-dto';
import { GetBlogsQueryParams } from './input-dto/get-blogs-query-params.input-dto';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly createBlogUseCase: CreateBlogUseCase,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}
  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogsViewDto>> {
    return this.blogsQueryRepository.getAll(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogsViewDto> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Post()
  async createBlog(@Body() body: BlogsInputDto): Promise<BlogsViewDto> {
    const blogId: string = await this.createBlogUseCase.execute(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail(blogId);
  }
}
