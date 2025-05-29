import { Blog, BlogDocument, BlogModelType } from '../../domain/blog.entity';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateBlogDto } from '../../dto/blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogCommand {
  constructor(public readonly dto: CreateBlogDto) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
  ) {}

  async execute({ dto }: CreateBlogCommand): Promise<string> {
    const blog: BlogDocument = this.BlogModel.createInstance(dto);

    return await this.blogsRepository.save(blog);
  }
}
