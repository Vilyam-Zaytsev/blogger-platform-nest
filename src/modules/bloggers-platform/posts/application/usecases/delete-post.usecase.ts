import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeletePostCommand {
  constructor(public readonly id: string) {}
}

@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute({ id }: DeletePostCommand): Promise<string> {
    const post: PostDocument =
      await this.postsRepository.getByIdOrNotFoundFail(id);

    post.makeDeleted();

    return this.postsRepository.save(post);
  }
}
