import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../../likes/dto/like.dto';
import { UpdateReactionsCommand } from '../../../likes/application/usecases/update-reactions.usecase';
import {
  LikeDocument,
  LikeStatus,
  ReactionUpdateResult,
} from '../../../likes/domain/like.entity';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';
import { NewestLike } from '../../domain/newest-like.schema';
import { UserDocument } from '../../../../user-accounts/domain/user.entity';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';

export class UpdatePostReactionsCommand {
  constructor(public readonly dto: UpdateReactionDto) {}
}

@CommandHandler(UpdatePostReactionsCommand)
export class UpdatePostReactionUseCase
  implements ICommandHandler<UpdatePostReactionsCommand>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly likesRepository: LikesRepository,
    private readonly usersRepository: UsersRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto }: UpdatePostReactionsCommand): Promise<void> {
    const post: PostDocument = await this.postsRepository.getByIdOrNotFoundFail(
      dto.parentId,
    );

    const { delta, currentReactionId }: ReactionUpdateResult =
      await this.commandBus.execute(new UpdateReactionsCommand(dto));

    if (currentReactionId && delta.currentReaction === LikeStatus.Like) {
      const [like, user] = await Promise.all([
        this.likesRepository.getByIdOrNotFoundFail(currentReactionId),
        this.usersRepository.getByIdOrNotFoundFail(dto.userId),
      ]);

      const newestLike: NewestLike = {
        addedAt: like.createdAt,
        userId: like.userId,
        login: user.login,
      };

      post.updateNewestLikes(newestLike);
    }

    post.updateReactionsCount(delta);
    await this.postsRepository.save(post);
  }
}
