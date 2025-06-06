import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogDocument } from '../../domain/blog.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteBlogCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}

  async execute({ id }: DeleteBlogCommand): Promise<string> {
    const blog: BlogDocument =
      await this.blogsRepository.getByIdOrNotFoundFail(id);

    blog.delete();

    return this.blogsRepository.save(blog);
  }
}
