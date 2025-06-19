import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwt-refresh-auth.guard';
import { SessionViewDto } from './view-dto/session.view-dto';
import { ExtractSessionFromRequest } from '../guards/decorators/extract-session-from-request.decorator';
import { SessionContextDto } from '../guards/dto/session-context.dto';
import { GetSessionsQuery } from '../application/queries/sessions/get-sessions.query-handler';
import { DeleteSessionsCommand } from '../application/usecases/sessions/delete-sessions.usecase';

@Controller('security/devices')
@UseGuards(JwtRefreshAuthGuard)
export class SessionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async getAll(
    @ExtractSessionFromRequest() session: SessionContextDto,
  ): Promise<SessionViewDto> {
    return this.queryBus.execute(new GetSessionsQuery(session));
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSessions(
    @ExtractSessionFromRequest() session: SessionContextDto,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteSessionsCommand(session));
  }
}
