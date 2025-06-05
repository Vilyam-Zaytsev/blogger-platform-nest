import {
  HasReactions,
  ReactionChange,
} from '../../modules/bloggers-platform/posts/domain/reactions-count.schema';
import { LikeStatus } from '../../modules/bloggers-platform/likes/domain/like.entity';
import { DomainException } from '../exceptions/damain-exceptions';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

/**
 * Adjusts the reactions count of an entity based on the change in user reaction.
 *
 * This function updates the `likesCount` and `dislikesCount` properties of the `reactionsCount` object
 * according to the previous and current reaction status provided in the `delta`.
 *
 * It decreases the count for the previous reaction (if any) and increases the count for the current reaction (if any).
 * Intended to be used with entities that implement the `HasReactions` interface.
 *
 * @param {ReactionChange} delta - Object containing the previous and current reactions.
 * @param {LikeStatus | null} delta.previousReaction - The user's previous reaction (Like, Dislike, or null).
 * @param {LikeStatus | null} delta.currentReaction - The user's current reaction (Like, Dislike, or null).
 *
 * @this {HasReactions} - The context object must have a `reactionsCount` property with numeric `likesCount` and `dislikesCount`.
 */
export function recalculateReactionsCount(
  this: HasReactions,
  delta: ReactionChange,
) {
  if (delta.previousReaction === LikeStatus.Like) {
    this.reactionsCount.likesCount--;
  }
  if (delta.previousReaction === LikeStatus.Dislike) {
    this.reactionsCount.dislikesCount--;
  }

  if (delta.currentReaction === LikeStatus.Like) {
    this.reactionsCount.likesCount++;
  }
  if (delta.currentReaction === LikeStatus.Dislike) {
    this.reactionsCount.dislikesCount++;
  }
}

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
