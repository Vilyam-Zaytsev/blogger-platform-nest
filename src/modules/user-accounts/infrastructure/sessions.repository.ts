import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/entities/session/session.entity';
import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly SessionModel: SessionModelType,
  ) {}

  async getAllSessionsExceptCurrent(
    userId: string,
    deviceId: string,
  ): Promise<SessionDocument[]> {
    return this.SessionModel.find({
      userId,
      deviceId: { $ne: deviceId },
      deletedAt: null,
    });
  }

  async getByUserIdAndDeviceIdOrNotFoundFail(
    userId: string,
    deviceId: string,
  ): Promise<SessionDocument> {
    const session: SessionDocument | null = await this.SessionModel.findOne({
      userId,
      deviceId,
      deletedAt: null,
    });

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The user (id: ${userId}) no active session on device (id: ${deviceId})`,
      });
    }

    return session;
  }

  async save(session: SessionDocument): Promise<string> {
    const resultSave: SessionDocument = await session.save();

    return resultSave._id.toString();
  }
}
