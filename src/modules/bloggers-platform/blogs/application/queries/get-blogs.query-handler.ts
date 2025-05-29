import { GetBlogsQueryParams } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { BlogViewDto } from '../../api/view-dto/blog-view.dto';
import { BlogsQueryRepository } from '../../infrastructure/query/blogs.query-repository';

export class GetBlogsQuery {
  constructor(public readonly queryParams: GetBlogsQueryParams) {}
}

@QueryHandler(GetBlogsQuery)
export class GetBlogsQueryHandler
  implements IQueryHandler<GetBlogsQuery, PaginatedViewDto<BlogViewDto>>
{
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}

  async execute({
    queryParams,
  }: GetBlogsQuery): Promise<PaginatedViewDto<BlogViewDto>> {
    return this.blogsQueryRepository.getAll(queryParams);
  }
}
