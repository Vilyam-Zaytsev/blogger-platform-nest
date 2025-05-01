import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { NotFoundException } from '@nestjs/common';

export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog: BlogDocument | null = await this.BlogModel.findOne({
      _id: id,
      deleted: null,
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return blog;
  }

  async save(blog: BlogDocument): Promise<string> {
    const resultSave: BlogDocument = await blog.save();

    return resultSave._id.toString();
  }
}
