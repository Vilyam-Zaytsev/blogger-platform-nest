import { HasReactions } from '../../modules/bloggers-platform/posts/domain/reactions-count.schema';
import {
  ReactionStatus,
  ReactionStatusDelta,
} from '../../modules/bloggers-platform/likes/domain/reaction.entity';
import { DomainException } from '../exceptions/damain-exceptions';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';
import { NewestLike } from '../../modules/bloggers-platform/posts/domain/newest-like.schema';

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
 * Appends a new like reaction to the beginning of the `newestLikes` list,
 * maintaining a maximum of 3 recent entries.
 *
 * This function ensures that the most recent like appears first in the list.
 * If the list already contains 3 elements, it removes the oldest (last) one
 * before inserting the new like at the beginning.
 *
 * @param {NewestLike} newestLike - The newest like to be added to the list.
 */
export function appendLatestReaction(
  this: { newestLikes: NewestLike[] },
  newestLike: NewestLike,
) {
  if (this.newestLikes.length < 3) {
    this.newestLikes.unshift(newestLike);

    return;
  }

  this.newestLikes.pop();
  this.newestLikes.unshift(newestLike);
}
