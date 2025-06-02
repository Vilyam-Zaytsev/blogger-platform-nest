import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.entity';
import { DomainException } from '../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private BlogModel: BlogModelType) {}

  async getByIdOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog: BlogDocument | null = await this.BlogModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The blog with ID (${id}) does not exist`,
      });
    }

    return blog;
  }

  async save(blog: BlogDocument): Promise<string> {
    const resultSave: BlogDocument = await blog.save();

    return resultSave._id.toString();
  }
}
