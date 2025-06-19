import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionContextDto } from '../../../guards/dto/session-context.dto';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { SessionDocument } from 'src/modules/user-accounts/domain/entities/session/session.entity';

export class DeleteSessionCommand {
  constructor(public readonly dto: SessionContextDto) {}
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
  implements ICommandHandler<DeleteSessionCommand>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute({ dto }: DeleteSessionCommand): Promise<string> {
    const session: SessionDocument =
      await this.sessionsRepository.getByUserIdAndDeviceIdOrNotFoundFail(
        dto.userId,
        dto.deviceId,
      );

    session.delete();

    return this.sessionsRepository.save(session);
  }
}
