import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../dto/reaction.dto';
import { ReactionsRepository } from '../../infrastructure/reactions-repository';
import {
  ReactionDocument,
  ReactionStatus,
  ReactionStatusDelta,
} from '../../domain/reaction.entity';
import { CreateReactionCommand } from './create-reaction-use.case';
import { PostsRepository } from '../../../posts/infrastructure/posts.repository';

export class UpdateReactionsCommand {
  constructor(public readonly dto: UpdateReactionDto) {}
}

@CommandHandler(UpdateReactionsCommand)
export class UpdateReactionUseCase
  implements ICommandHandler<UpdateReactionsCommand>
{
  constructor(
    private readonly reactionsRepository: ReactionsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: UpdateReactionsCommand): Promise<ReactionStatusDelta> {
    const { status, userId, parentId } = dto;

    const reaction: ReactionDocument | null =
      await this.reactionsRepository.getByUserIdAndParentId(userId, parentId);

    if (!reaction) {
      await this.commandBus.execute(new CreateReactionCommand(dto));

      return {
        currentStatus: status,
        previousStatus: ReactionStatus.None,
      };
    }

    if (reaction.status === status) {
      return {
        currentStatus: ReactionStatus.None,
        previousStatus: ReactionStatus.None,
      };
    }

    const previousStatus: ReactionStatus = reaction.status;

    reaction.updateStatus(status);
    await this.reactionsRepository.save(reaction);

    return {
      currentStatus: status,
      previousStatus,
    };
  }
}
