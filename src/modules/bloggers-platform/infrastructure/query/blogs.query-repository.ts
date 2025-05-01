import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../../domain/blog.entity';
import { BlogsViewDto } from '../../api/view-dto/blogs.view-dto';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogsViewDto> {
    const blog: BlogDocument | null = await this.BlogModel.findOne({
      _id: id,
      deleted: null,
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return BlogsViewDto.mapToView(blog);
  }
}
