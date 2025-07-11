import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtRefreshAuthGuard } from '../guards/bearer/jwt-refresh-auth.guard';
import { SessionViewDto } from './view-dto/session.view-dto';
import { ExtractSessionFromRequest } from '../guards/decorators/extract-session-from-request.decorator';
import { SessionContextDto } from '../guards/dto/session-context.dto';
import { GetSessionsQuery } from '../application/queries/sessions/get-sessions.query-handler';
import { DeleteSessionsCommand } from '../application/usecases/sessions/delete-sessions.usecase';
import { DeleteSessionCommand } from '../application/usecases/sessions/delete-session.usecase';
import { IdInputDto } from '../../../core/types/id.input-dto';

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(
    @ExtractSessionFromRequest() session: SessionContextDto,
    @Param() params: IdInputDto,
  ): Promise<void> {
    return this.commandBus.execute(
      new DeleteSessionCommand(session, params.id),
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSessions(
    @ExtractSessionFromRequest() session: SessionContextDto,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteSessionsCommand(session));
  }
}
