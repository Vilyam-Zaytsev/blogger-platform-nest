import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../../domain/post.entity';
import { PostViewDto } from '../../api/view-dto/post-view.dto';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { GetPostsQueryParams } from '../../api/input-dto/get-posts-query-params.input-dto';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';
import { LikeDocument, LikeStatus } from '../../../likes/domain/like.entity';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name)
    private readonly PostModel: PostModelType,
    private readonly blogsRepository: BlogsRepository,
    private readonly likesRepository: LikesRepository,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDto> {
    const post: PostDocument | null = await this.PostModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    //TODO:!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    const ЗАГЛУШКА = LikeStatus.None;

    return PostViewDto.mapToView(post, ЗАГЛУШКА);
  }

  async getAll(
    query: GetPostsQueryParams,
    user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    const filter: FilterQuery<Post> = {
      deletedAt: null,
    };

    const posts: PostDocument[] = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const postsIds: string[] = posts.map((post) => post._id.toString());

    const allLikesForPosts: LikeDocument[] =
      await this.likesRepository.getLikesByParentIdsAndStatusLike(postsIds);

    const mapUserReactionsForPosts: Map<string, LikeStatus> = new Map();

    if (user) {
      allLikesForPosts.reduce<Map<string, LikeStatus>>(
        (
          acc: Map<string, LikeStatus>,
          like: LikeDocument,
        ): Map<string, LikeStatus> => {
          if (like.userId === user.id) {
            acc.set(like.parentId, like.status);
          }

          acc.set(like.parentId, LikeStatus.None);

          return acc;
        },
        mapUserReactionsForPosts,
      );
    }

    const items: PostViewDto[] = posts.map(
      (post: PostDocument): PostViewDto => {
        let myStatus: LikeStatus | undefined;

        if (user) {
          const id: string = post._id.toString();

          myStatus = mapUserReactionsForPosts.get(id);
        }

        return PostViewDto.mapToView(
          post,
          myStatus ? myStatus : LikeStatus.None,
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

  async getPostsByBlogId(
    query: GetPostsQueryParams,
    blogId: string,
  ): Promise<PaginatedViewDto<PostViewDto>> {
    await this.blogsRepository.getByIdOrNotFoundFail(blogId);

    const filter: FilterQuery<Post> = {
      blogId,
      deletedAt: null,
    };

    const posts: PostDocument[] = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount: number = await this.PostModel.countDocuments(filter);

    //TODO:!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    const ЗАГЛУШКА = LikeStatus.None;

    const items: PostViewDto[] = posts.map(
      (post: PostDocument): PostViewDto =>
        PostViewDto.mapToView(post, ЗАГЛУШКА),
    );

    return PaginatedViewDto.mapToView<PostViewDto>({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
