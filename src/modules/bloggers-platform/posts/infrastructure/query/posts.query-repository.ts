import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post-view.dto';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import {
  ReactionDocument,
  ReactionStatus,
} from '../../../reactions/domain/reaction.entity';
import { ReactionsRepository } from '../../../reactions/infrastructure/reactions-repository';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
    private readonly reactionsRepository: ReactionsRepository,
  ) {}

  async getByIdOrNotFoundFail(
    id: string,
    user?: UserContextDto | null,
  ): Promise<PostViewDto> {
    const post: PostDocument | null = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The post with ID (${id}) does not exist`,
      });
    }

    let userReactionStatus: ReactionStatus = ReactionStatus.None;

    if (user) {
      const reaction: ReactionDocument | null =
        await this.reactionsRepository.getByUserIdAndParentId(
          user.id,
          post._id.toString(),
        );

      userReactionStatus = reaction ? reaction.status : ReactionStatus.None;
    }

    return PostViewDto.mapToView(post, userReactionStatus);
  }

  async getAll(
    query: GetPostsQueryParams,
    user: UserContextDto | null,
    blogId?: string,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    if (blogId) {
      filter['blogId'] = blogId;
    }

    const posts: PostDocument[] = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const postsIds: string[] = posts.map((post) => post._id.toString());

    const allReactionsForPosts: ReactionDocument[] =
      await this.reactionsRepository.getByParentIds(postsIds);

    const mapUserReactionsForPosts: Map<string, ReactionStatus> = new Map();

    if (user) {
      allReactionsForPosts.reduce<Map<string, ReactionStatus>>(
        (
          acc: Map<string, ReactionStatus>,
          reaction: ReactionDocument,
        ): Map<string, ReactionStatus> => {
          if (reaction.userId === user.id) {
            acc.set(reaction.parentId, reaction.status);
          }

          return acc;
        },
        mapUserReactionsForPosts,
      );
    }

    const items: PostViewDto[] = posts.map(
      (post: PostDocument): PostViewDto => {
        let myStatus: ReactionStatus | undefined;

        if (user) {
          const id: string = post._id.toString();

          myStatus = mapUserReactionsForPosts.get(id);
        }

        return PostViewDto.mapToView(
          post,
          myStatus ? myStatus : ReactionStatus.None,
        );
      },
    );

    const totalCount: number = await this.PostModel.countDocuments(filter);

    return PaginatedViewDto.mapToView<PostViewDto>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
