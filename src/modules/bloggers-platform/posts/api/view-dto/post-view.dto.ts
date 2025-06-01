import { PostDocument } from '../../domain/post.entity';
import { LastLike } from '../../domain/last-likes.schema';

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
      newestLikes: post.lastLikes,
    };
    dto.createdAt = post.createdAt.toISOString();

    return dto;
  }
}

type ExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: LastLike[];
};

//TODO: вынести в отдельный файл!!!
export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}
