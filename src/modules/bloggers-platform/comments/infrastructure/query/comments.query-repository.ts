import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ReactionDocument,
  ReactionStatus,
} from '../../../reactions/domain/reaction.entity';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { CommentViewDto } from '../../api/view-dto/comment-view.dto';
import {
  Comment,
  CommentDocument,
  CommentModelType,
} from '../../domain/comment.entity';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { ReactionsRepository } from '../../../reactions/infrastructure/reactions-repository';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name)
    private readonly CommentModel: CommentModelType,
    private readonly reactionsRepository: ReactionsRepository,
  ) {}
  async getByIdOrNotFoundFail(
    id: string,
    user?: UserContextDto | null,
  ): Promise<CommentViewDto> {
    const comment: CommentDocument | null = await this.CommentModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The comment with ID (${id}) does not exist`,
      });
    }

    let userReactionStatus: ReactionStatus = ReactionStatus.None;

    if (user) {
      const reaction: ReactionDocument | null =
        await this.reactionsRepository.getByUserIdAndParentId(
          user.id,
          comment._id.toString(),
        );

      userReactionStatus = reaction ? reaction.status : ReactionStatus.None;
    }

    return CommentViewDto.mapToView(comment, userReactionStatus);
  }

  async getAll(
    query: GetCommentsQueryParams,
    user: UserContextDto | null,
    postId: string,
  ): Promise<PaginatedViewDto<CommentViewDto>> {
    const filter: FilterQuery<Comment> = {
      postId,
      deletedAt: null,
    };

    const comments: CommentDocument[] = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const commentsIds: string[] = comments.map(
      (comment: CommentDocument): string => comment._id.toString(),
    );

    const allReactionsForComments: ReactionDocument[] =
      await this.reactionsRepository.getByParentIds(commentsIds);

    const mapUserReactionsForComments: Map<string, ReactionStatus> = new Map();

    if (user) {
      allReactionsForComments.reduce<Map<string, ReactionStatus>>(
        (
          acc: Map<string, ReactionStatus>,
          reaction: ReactionDocument,
        ): Map<string, ReactionStatus> => {
          if (reaction.userId === user.id) {
            acc.set(reaction.parentId, reaction.status);
          }

          return acc;
        },
        mapUserReactionsForComments,
      );
    }

    const items: CommentViewDto[] = comments.map(
      (comment: CommentDocument): CommentViewDto => {
        let myStatus: ReactionStatus | undefined;

        if (user) {
          const id: string = comment._id.toString();

          myStatus = mapUserReactionsForComments.get(id);
        }

        return CommentViewDto.mapToView(
          comment,
          myStatus ? myStatus : ReactionStatus.None,
        );
      },
    );

    const totalCount: number = await this.CommentModel.countDocuments(filter);

    return PaginatedViewDto.mapToView<CommentViewDto>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
