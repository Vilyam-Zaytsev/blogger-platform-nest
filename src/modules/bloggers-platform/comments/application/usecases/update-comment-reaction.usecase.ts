import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../../reactions/dto/reaction.dto';
import { UpdateReactionsCommand } from '../../../reactions/application/usecases/update-reactions.usecase';
import { ReactionStatusDelta } from '../../../reactions/domain/reaction.entity';
import { UpdatePostReactionCommand } from '../../../posts/application/usecases/update-post-reaction.usecase';
import { CommentsRepository } from '../../infrastructure/comments-repository';
import { CommentDocument } from '../../domain/comment.entity';

export class UpdateCommentReactionCommand {
  constructor(public readonly dto: UpdateReactionDto) {}
}

@CommandHandler(UpdateCommentReactionCommand)
export class UpdateCommentReactionUseCase
  implements ICommandHandler<UpdateCommentReactionCommand>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: UpdatePostReactionCommand): Promise<void> {
    const comment: CommentDocument =
      await this.commentsRepository.getByIdOrNotFoundFail(dto.parentId);

    const { currentStatus, previousStatus }: ReactionStatusDelta =
      await this.commandBus.execute(new UpdateReactionsCommand(dto));

    const statusDelta: ReactionStatusDelta = {
      currentStatus,
      previousStatus,
    };

    comment.updateReactionsCount(statusDelta);
    await this.commentsRepository.save(comment);
  }
}
