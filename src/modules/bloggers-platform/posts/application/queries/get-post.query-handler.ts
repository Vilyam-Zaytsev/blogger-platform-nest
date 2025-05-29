import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostViewDto } from '../../api/view-dto/post-view.dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';

export class GetPostQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetPostQuery)
export class GetPostQueryHandler
  implements IQueryHandler<GetPostQuery, PostViewDto>
{
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}

  async execute({ id }: GetPostQuery): Promise<PostViewDto> {
    return this.postsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
