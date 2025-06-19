import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionContextDto } from '../../../guards/dto/session-context.dto';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { SessionDocument } from 'src/modules/user-accounts/domain/entities/session/session.entity';

export class DeleteSessionsCommand {
  constructor(public readonly dto: SessionContextDto) {}
}

@CommandHandler(DeleteSessionsCommand)
export class DeleteSessionsUseCase
  implements ICommandHandler<DeleteSessionsCommand>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute({ dto }: DeleteSessionsCommand): Promise<void> {
    const sessions: SessionDocument[] =
      await this.sessionsRepository.getAllSessionsExceptCurrent(
        dto.userId,
        dto.deviceId,
      );

    const savePromises: Promise<string>[] = sessions.map(
      (session: SessionDocument): Promise<string> => {
        session.delete();

        return this.sessionsRepository.save(session);
      },
    );

    await Promise.all(savePromises);
  }
}
