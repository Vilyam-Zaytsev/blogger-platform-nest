import { PostDocument } from '../../domain/post.entity';
import { NewestLikes } from '../../domain/last-likes.schema';
import { LikeStatus } from '../../../likes/domain/like.entity';

export class PostViewDto {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  extendedLikesInfo: ExtendedLikesInfo;
  createdAt: string;

  static mapToView(post: PostDocument): PostViewDto {
    const dto = new this();

    dto.id = post._id.toString();
    dto.title = post.title;
    dto.shortDescription = post.shortDescription;
    dto.content = post.content;
    dto.blogId = post.blogId;
    dto.blogName = post.blogName;
    dto.extendedLikesInfo = {
      likesCount: post.reactionsCount.likesCount,
      dislikesCount: post.reactionsCount.dislikesCount,
      myStatus: LikeStatus.None,
      newestLikes: post.newestLikes,
    };
    dto.createdAt = post.createdAt.toISOString();

    return dto;
  }
}

export type ExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: NewestLikes[];
};
