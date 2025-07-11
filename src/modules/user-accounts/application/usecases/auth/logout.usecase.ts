import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionContextDto } from '../../../guards/dto/session-context.dto';
import { SessionDocument } from '../../../domain/entities/session/session.entity';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class LogoutCommand {
  constructor(public readonly sessionData: SessionContextDto) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUseCase implements ICommandHandler<LogoutCommand> {
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute({ sessionData }: LogoutCommand) {
    const session: SessionDocument | null =
      await this.sessionsRepository.getByDeviceId(sessionData.deviceId);

    if (!session) {
      // throw new Error('Failed to delete a session. The session was not found.');
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: `Unauthorized`,
      });
    }

    session.delete();

    return await this.sessionsRepository.save(session);
  }
}
