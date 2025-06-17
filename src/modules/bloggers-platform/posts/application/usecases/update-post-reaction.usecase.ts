import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../../reactions/dto/reaction.dto';
import { UpdateReactionsCommand } from '../../../reactions/application/usecases/update-reactions.usecase';
import {
  ReactionDocument,
  ReactionStatus,
  ReactionStatusDelta,
} from '../../../reactions/domain/reaction.entity';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
import { UserDocument } from '../../../../user-accounts/domain/user.entity';
import { ReactionsRepository } from '../../../reactions/infrastructure/reactions-repository';

export class UpdatePostReactionCommand {
  constructor(public readonly dto: UpdateReactionDto) {}
}

@CommandHandler(UpdatePostReactionCommand)
export class UpdatePostReactionUseCase
  implements ICommandHandler<UpdatePostReactionCommand>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly reactionsRepository: ReactionsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: UpdatePostReactionCommand): Promise<void> {
    const post: PostDocument = await this.postsRepository.getByIdOrNotFoundFail(
      dto.parentId,
    );

    const { currentStatus, previousStatus }: ReactionStatusDelta =
      await this.commandBus.execute(new UpdateReactionsCommand(dto));

    if (
      currentStatus === ReactionStatus.Like ||
      (currentStatus === ReactionStatus.Dislike &&
        previousStatus === ReactionStatus.Like) ||
      (currentStatus === ReactionStatus.None &&
        previousStatus === ReactionStatus.Like)
    ) {
      const lastThreeLikes: ReactionDocument[] =
        await this.reactionsRepository.getRecentLikes(dto.parentId);

      const userIds: string[] = lastThreeLikes.map(
        (like: ReactionDocument): string => like.userId,
      );

      const users: UserDocument[] =
        await this.usersRepository.getByIds(userIds);

      post.updateNewestLikes(lastThreeLikes, users);
    }

    const statusDelta: ReactionStatusDelta = {
      currentStatus,
      previousStatus,
    };

    post.updateReactionsCount(statusDelta);
    await this.postsRepository.save(post);
  }
}
