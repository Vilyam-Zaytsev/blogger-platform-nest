import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSessionDto } from '../../../dto/create-session.dto';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../../../domain/entities/session/session.entity';
import { InjectModel } from '@nestjs/mongoose';
import { parseUserAgent } from '../../../../../core/utils/parse-user-agent.util';
import { CreateSessionDomainDto } from '../../../domain/dto/create-session.domain.dto';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';

export class CreateSessionCommand {
  constructor(public dto: CreateSessionDto) {}
}

@CommandHandler(CreateSessionCommand)
export class CreateSessionUseCase
  implements ICommandHandler<CreateSessionCommand>
{
  constructor(
    @InjectModel(Session.name) private readonly SessionModel: SessionModelType,
    private readonly sessionsRepository: SessionsRepository,
  ) {}

  async execute({ dto }: CreateSessionCommand): Promise<string> {
    const deviceName: string = parseUserAgent(dto.userAgent);
    const createSessionDomainDto: CreateSessionDomainDto = {
      userId: dto.userId,
      deviceId: dto.deviceId,
      deviceName,
      ip: dto.ip,
      iat: new Date(dto.iat * 1000),
      exp: new Date(dto.exp * 1000),
    };

    const session: SessionDocument = this.SessionModel.createInstance(
      createSessionDomainDto,
    );

    return this.sessionsRepository.save(session);
  }
}
