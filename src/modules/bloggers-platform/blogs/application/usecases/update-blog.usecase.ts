import { Injectable } from '@nestjs/common';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogDocument } from '../../domain/blog.entity';
import { UpdateBlogDto } from '../../dto/blog.dto';
//TODO: нужно ли обновлять blogName в комменте при обновлении блога???
@Injectable()
export class UpdateBlogUseCase {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute(id: string, dto: UpdateBlogDto): Promise<string> {
    const blog: BlogDocument =
      await this.blogsRepository.getByIdOrNotFoundFail(id);

    blog.update(dto);

    return this.blogsRepository.save(blog);
  }
}
