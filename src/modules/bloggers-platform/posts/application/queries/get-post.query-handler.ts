import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostViewDto } from '../../api/view-dto/post-view.dto';
import { PostsQueryRepository } from '../../infrastructure/query/posts.query-repository';
import { UserContextDto } from '../../../../user-accounts/guards/dto/user-context.dto';

export class GetPostQuery {
  constructor(
    public readonly id: string,
    public readonly user: UserContextDto | null,
  ) {}
}

@QueryHandler(GetPostQuery)
export class GetPostQueryHandler
  implements IQueryHandler<GetPostQuery, PostViewDto>
{
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}

  async execute({ id, user }: GetPostQuery): Promise<PostViewDto> {
    return this.postsQueryRepository.getByIdOrNotFoundFail(id, user);
  }
}
