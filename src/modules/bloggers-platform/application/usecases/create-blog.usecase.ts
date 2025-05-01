import { Injectable } from '@nestjs/common';
import { CreateBlogDto } from '../../dto/create-blog.dto';
import { Blog, BlogDocument, BlogModelType } from '../../domain/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsRepository } from '../../infrastructure/blogs.repository';

@Injectable()
export class CreateBlogUseCase {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
  ) {}

  async execute(dto: CreateBlogDto): Promise<string> {
    const blog: BlogDocument = this.BlogModel.createInstance(dto);

    return await this.blogsRepository.save(blog);
  }
}
