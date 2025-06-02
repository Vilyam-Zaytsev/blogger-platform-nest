import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum } from 'class-validator';

export enum CommentsSortBy {
  CreatedAt = 'createdAt',
}

export class GetCommentsQueryParams extends BaseQueryParams<CommentsSortBy> {
  @IsEnum(CommentsSortBy)
  sortBy: CommentsSortBy = CommentsSortBy.CreatedAt;
}
