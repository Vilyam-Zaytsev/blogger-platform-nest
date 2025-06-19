import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SessionViewDto } from '../../../api/view-dto/session.view-dto';
import { SessionsQueryRepository } from '../../../infrastructure/query/sessions-query-repository.service';
import { SessionContextDto } from '../../../guards/dto/session-context.dto';

export class GetSessionsQuery {
  constructor(public readonly dto: SessionContextDto) {}
}

@QueryHandler(GetSessionsQuery)
export class GetSessionsQueryHandler
  implements IQueryHandler<GetSessionsQuery, SessionViewDto[]>
{
  constructor(
    private readonly sessionsQueryRepository: SessionsQueryRepository,
  ) {}

  async execute({ dto }: GetSessionsQuery): Promise<SessionViewDto[]> {
    return this.sessionsQueryRepository.getByUserId(dto.userId);
  }
}
