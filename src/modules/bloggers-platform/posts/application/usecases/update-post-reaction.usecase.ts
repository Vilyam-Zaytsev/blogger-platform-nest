import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostDocument } from '../../domain/post.entity';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateReactionDto } from '../../../likes/dto/reaction.dto';
import { UpdateReactionsCommand } from '../../../likes/application/usecases/update-reactions.usecase';
import {
  ReactionDelta,
  ReactionDocument,
  ReactionStatus,
  ReactionStatusDelta,
} from '../../../likes/domain/reaction.entity';
import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
import { UserDocument } from '../../../../user-accounts/domain/user.entity';
import { ReactionsRepository } from '../../../likes/infrastructure/reactions-repository';

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
        await this.reactionsRepository.getRecentLikesForOnePost(dto.parentId);

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

// import { PostsRepository } from '../../infrastructure/posts.repository';
// import { PostDocument } from '../../domain/post.entity';
// import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
// import { UpdateReactionDto } from '../../../likes/dto/like.dto';
// import { UpdateReactionsCommand } from '../../../likes/application/usecases/update-reactions.usecase';
// import {
//   ReactionDelta,
//   ReactionStatus,
//   ReactionStatusDelta,
// } from '../../../likes/domain/reaction.entity';
// import { NewestLike } from '../../domain/newest-like.schema';
// import { UsersRepository } from '../../../../user-accounts/infrastructure/users.repository';
// import { UserDocument } from '../../../../user-accounts/domain/user.entity';
//
// export class UpdatePostReactionCommand {
//   constructor(public readonly dto: UpdateReactionDto) {}
// }
//
// @CommandHandler(UpdatePostReactionCommand)
// export class UpdatePostReactionUseCase
//   implements ICommandHandler<UpdatePostReactionCommand>
// {
//   constructor(
//     private readonly postsRepository: PostsRepository,
//     private readonly usersRepository: UsersRepository,
//     private readonly commandBus: CommandBus,
//   ) {}
//
//   async execute({ dto }: UpdatePostReactionCommand): Promise<void> {
//     const post: PostDocument = await this.postsRepository.getByIdOrNotFoundFail(
//       dto.parentId,
//     );
//
//     const { currentReaction, previousReaction }: ReactionDelta =
//       await this.commandBus.execute(new UpdateReactionsCommand(dto));
//
//     if (currentReaction.status === ReactionStatus.Like) {
//       const user: UserDocument =
//         await this.usersRepository.getByIdOrNotFoundFail(
//           currentReaction.userId,
//         );
//
//       const newestLike: NewestLike = {
//         addedAt: currentReaction.createdAt,
//         userId: currentReaction.userId,
//         login: user.login,
//       };
//
//       post.updateNewestLikes(newestLike);
//     }
//
//     if (
//       (currentReaction.status === ReactionStatus.Dislike &&
//         previousReaction?.status === ReactionStatus.Like) ||
//       (currentReaction.status === ReactionStatus.None &&
//         previousReaction?.status === ReactionStatus.Like)
//     ) {
//       const hasLike: boolean = post.newestLikes.some(
//         (like) =>
//           like.userId === previousReaction.userId &&
//           like.addedAt === previousReaction.createdAt,
//       );
//
//       if (hasLike) {
//         post.removeFromNewestLikes(previousReaction.userId);
//       }
//     }
//
//     const statusDelta: ReactionStatusDelta = {
//       currentStatus: currentReaction.status,
//       previousStatus: previousReaction ? previousReaction.status : null,
//     };
//
//     post.updateReactionsCount(statusDelta);
//     await this.postsRepository.save(post);
//   }
// }
