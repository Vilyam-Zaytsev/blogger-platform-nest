import { HasReactions } from '../../modules/bloggers-platform/posts/domain/reactions-count.schema';
import {
  ReactionDocument,
  ReactionStatus,
  ReactionStatusDelta,
} from '../../modules/bloggers-platform/reactions/domain/reaction.entity';
import { DomainException } from '../exceptions/damain-exceptions';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';
import { NewestLike } from '../../modules/bloggers-platform/posts/domain/newest-like.schema';
import { UserDocument } from '../../modules/user-accounts/domain/user.entity';

/**
 * Marks an entity as deleted by setting its `deletedAt` timestamp.
 *
 * Throws a `DomainException` if the entity is already marked as deleted.
 * This function is intended for use with entities that have a nullable `deletedAt` property.
 *
 * @this {{ deletedAt: Date | null }} - The context object must have a `deletedAt` property.
 *
 * @throws {DomainException} Throws an exception with code `BadRequest` and message 'Entity already deleted'
 * if the entity was already marked as deleted.
 */
export function makeDeleted(this: { deletedAt: Date | null }) {
  if (this.deletedAt !== null) {
    throw new DomainException({
      code: DomainExceptionCode.BadRequest,
      message: 'Entity already deleted',
    });
  }

  this.deletedAt = new Date();
}

/**
 * Adjusts the reactions count of an entity based on the change in user reaction.
 *
 * This function updates the `likesCount` and `dislikesCount` properties of the `reactionsCount` object
 * according to the previous and current reaction status provided in the `delta`.
 *
 * It decreases the count for the previous reaction (if any) and increases the count for the current reaction (if any).
 * Intended to be used with entities that implement the `HasReactions` interface.
 *
 * @param {ReactionChange} statusDelta - Object containing the previous and current reactions.
 * @param {ReactionStatus | null} statusDelta.previousReaction - The user's previous reaction (Like, Dislike, or null).
 * @param {ReactionStatus | null} statusDelta.currentReaction - The user's current reaction (Like, Dislike, or null).
 *
 * @this {HasReactions} - The context object must have a `reactionsCount` property with numeric `likesCount` and `dislikesCount`.
 */
export function recalculateReactionsCount(
  this: HasReactions,
  statusDelta: ReactionStatusDelta,
) {
  if (statusDelta.previousStatus === ReactionStatus.Like) {
    this.reactionsCount.likesCount--;
  }
  if (statusDelta.previousStatus === ReactionStatus.Dislike) {
    this.reactionsCount.dislikesCount--;
  }

  if (statusDelta.currentStatus === ReactionStatus.Like) {
    this.reactionsCount.likesCount++;
  }
  if (statusDelta.currentStatus === ReactionStatus.Dislike) {
    this.reactionsCount.dislikesCount++;
  }
}

/**
 * Maps an array of reaction documents to an array of `NewestLike` objects
 * by associating each reaction with its corresponding user's login information.
 *
 * This function is typically used to build a simplified list of the most recent likes
 * to be shown in a UI, such as the 3 latest users who liked a post.
 *
 * Each `ReactionDocument` is matched to a `UserDocument` by `userId`. If a user is found,
 * a `NewestLike` object is created and added to the result. Reactions without a matching user
 * are silently ignored.
 *
 * @param {ReactionDocument[]} reactions - The list of reactions to process.
 * @param {UserDocument[]} users - A list of users, used to look up login information by userId.
 *
 * @returns {NewestLike[]} An array of `NewestLike` objects containing the user's ID, login, and the timestamp of the like.
 */
export function mapReactionsToNewestLikes(
  reactions: ReactionDocument[],
  users: UserDocument[],
): NewestLike[] {
  return reactions.reduce((acc: NewestLike[], like: ReactionDocument) => {
    const user = users.find((user) => user.id === like.userId);

    if (user) {
      acc.push({
        addedAt: like.createdAt,
        userId: like.userId,
        login: user.login,
      });
    }

    return acc;
  }, []);
}
