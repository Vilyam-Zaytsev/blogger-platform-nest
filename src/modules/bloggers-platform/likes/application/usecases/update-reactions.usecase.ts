import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../dto/like.dto';
import { LikesRepository } from '../../infrastructure/likes.repository';
import {
  LikeDocument,
  LikeStatus,
  ReactionUpdateResult,
} from '../../domain/like.entity';
import { CreateLikeCommand } from './create-like.usecase';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateReactionsCommand {
  constructor(public readonly dto: UpdateReactionDto) {}
}

@CommandHandler(UpdateReactionsCommand)
export class UpdateReactionUseCase
  implements ICommandHandler<UpdateReactionsCommand>
{
  constructor(
    private readonly likesRepository: LikesRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({
    dto,
  }: UpdateReactionsCommand): Promise<ReactionUpdateResult> {
    const { status, userId, parentId } = dto;

    const like: LikeDocument | null =
      await this.likesRepository.getLikeByUserIdAndParentId(userId, parentId);

    if (!like) {
      const currentReactionId: string = await this.commandBus.execute(
        new CreateLikeCommand(dto),
      );

      //TODO: что если status 'None'?
      return {
        delta: {
          currentReaction: status,
          previousReaction: null,
        },
        currentReactionId,
      };
    }

    //TODO:  что делать если статусы совпадают?
    if (like.status === status) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `User (${userId}) has already set this reaction (${status}) for the target (${parentId})`,
      });
    }

    const previousReaction: LikeStatus = like.status;

    like.updateStatus(status);
    await this.likesRepository.save(like);

    return {
      delta: {
        currentReaction: status,
        previousReaction,
      },
      currentReactionId: null,
    };
  }
}
