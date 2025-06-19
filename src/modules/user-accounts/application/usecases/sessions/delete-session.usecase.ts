import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionContextDto } from '../../../guards/dto/session-context.dto';
import { SessionsRepository } from '../../../infrastructure/sessions.repository';
import { SessionDocument } from 'src/modules/user-accounts/domain/entities/session/session.entity';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteSessionCommand {
  constructor(
    public readonly dto: SessionContextDto,
    public readonly deviceId: string,
  ) {}
}

@CommandHandler(DeleteSessionCommand)
export class DeleteSessionUseCase
  implements ICommandHandler<DeleteSessionCommand>
{
  constructor(private readonly sessionsRepository: SessionsRepository) {}

  async execute({ dto, deviceId }: DeleteSessionCommand): Promise<string> {
    const session: SessionDocument | null =
      await this.sessionsRepository.getByDeviceId(deviceId);

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The session with ID (${deviceId}) does not exist`,
      });
    }

    if (session.userId !== dto.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `The user does not have permission to delete this session`,
      });
    }

    session.delete();

    return this.sessionsRepository.save(session);
  }
}
