import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { UpdatePostDto } from '../../dto/post.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdatePostCommand {
  constructor(
    public readonly dto: UpdatePostDto,
    public readonly id: string,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute({ dto, id }: UpdatePostCommand): Promise<string> {
    const post: PostDocument =
      await this.postsRepository.getByIdOrNotFoundFail(id);

    post.update(dto);

    return this.postsRepository.save(post);
  }
}
