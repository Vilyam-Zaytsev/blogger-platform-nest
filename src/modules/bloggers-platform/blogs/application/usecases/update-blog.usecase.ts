import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogDocument } from '../../domain/blog.entity';
import { UpdateBlogDto } from '../../dto/blog.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateBlogCommand {
  constructor(
    public readonly dto: UpdateBlogDto,
    public readonly id: string,
  ) {}
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute({ dto, id }: UpdateBlogCommand): Promise<string> {
    const blog: BlogDocument =
      await this.blogsRepository.getByIdOrNotFoundFail(id);

    blog.update(dto);

    return this.blogsRepository.save(blog);
  }
}
