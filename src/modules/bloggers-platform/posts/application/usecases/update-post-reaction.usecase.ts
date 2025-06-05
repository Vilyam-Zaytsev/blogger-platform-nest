import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../../likes/dto/like.dto';
import { UpdateReactionsCommand } from '../../../likes/application/usecases/update-reactions.usecase';
import { ReactionChange } from '../../domain/reactions-count.schema';

export class UpdatePostReactionsCommand {
  constructor(public readonly dto: UpdateReactionDto) {}
}

@CommandHandler(UpdatePostReactionsCommand)
export class UpdatePostReactionUseCase
  implements ICommandHandler<UpdatePostReactionsCommand>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: UpdatePostReactionsCommand): Promise<void> {
    const post: PostDocument = await this.postsRepository.getByIdOrNotFoundFail(
      dto.parentId,
    );

    const reactionDelta: ReactionChange = await this.commandBus.execute(
      new UpdateReactionsCommand(dto),
    );

    post.updateReactionsCount(reactionDelta);
    await this.postsRepository.save(post);
  }
}
