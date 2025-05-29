import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum } from 'class-validator';

export enum PostsSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  DeletedAt = 'deletedAt',
  Title = 'title',
  BlogId = 'blogId',
  BlogName = 'blogName',
}

export class GetPostsQueryParams extends BaseQueryParams<PostsSortBy> {
  @IsEnum(PostsSortBy)
  sortBy: PostsSortBy = PostsSortBy.CreatedAt;
}
