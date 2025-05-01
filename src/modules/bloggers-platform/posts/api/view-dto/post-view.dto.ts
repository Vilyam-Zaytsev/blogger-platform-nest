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
    (dto.extendedLikesInfo = {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatus.None,
      newestLikes: [],
    }),
      (dto.createdAt = post.createdAt.toISOString());

    return dto;
  }
}

type ExtendedLikesInfo = {
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatus;
  newestLikes: LikeDetails[];
};

type LikeDetails = {
  addedAt: string;
  userId: string;
  login: string;
};

enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}
