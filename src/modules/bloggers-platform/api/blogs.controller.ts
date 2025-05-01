import { Body, Controller, Post } from '@nestjs/common';
import { BlogsInputDto } from './input-dto/blogs.input-dto';
import { BlogsViewDto } from './view-dto/blogs.view-dto';

@Controller('blogs')
export class BlogsController {
  @Post()
  async createBlog(@Body body: BlogsInputDto): Promise<BlogsViewDto> {}
}
