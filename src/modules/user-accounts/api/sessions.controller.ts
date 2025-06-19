import { Controller, Get, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwt-refresh-auth.guard';
import { SessionViewDto } from './view-dto/session.view-dto';
import { ExtractSessionFromRequest } from '../guards/decorators/extract-session-from-request.decorator';
import { SessionContextDto } from '../guards/dto/session-context.dto';
import { GetSessionsQuery } from '../application/queries/sessions/get-sessions.query-handler';

@Controller('security/devices')
@UseGuards(JwtRefreshAuthGuard)
export class SessionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async getAll(
    @ExtractSessionFromRequest() session: SessionContextDto,
  ): Promise<SessionViewDto> {
    return this.queryBus.execute(new GetSessionsQuery(session));
  }
}
