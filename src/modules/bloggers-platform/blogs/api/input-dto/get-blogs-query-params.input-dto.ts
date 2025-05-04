import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { BlogsSortBy } from './blogs-sort-by';

export class GetBlogsQueryParams extends BaseQueryParams<BlogsSortBy> {
  sortBy: BlogsSortBy = BlogsSortBy.CreatedAt;
  searchNameTerm: string | null = null;
}
