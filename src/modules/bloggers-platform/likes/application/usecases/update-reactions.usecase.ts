import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../dto/reaction.dto';
import { ReactionsRepository } from '../../infrastructure/reactions-repository';
import {
  ReactionDocument,
  ReactionStatus,
  ReactionStatusDelta,
} from '../../domain/reaction.entity';
import { CreateReactionCommand } from './create-reaction-use.case';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
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

    //TODO:  что делать если статусы совпадают?
    if (reaction.status === status) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `User (${userId}) has already set this reaction (${status}) for the target (${parentId})`,
      });
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
