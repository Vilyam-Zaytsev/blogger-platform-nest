import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogDocument } from '../../domain/blog.entity';

@Injectable()
export class DeleteBlogUseCase {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(id: string): Promise<string> {
    const blog: BlogDocument =
      await this.blogsRepository.getByIdOrNotFoundFail(id);

    blog.makeDeleted();

    return this.blogsRepository.save(blog);
  }
}
