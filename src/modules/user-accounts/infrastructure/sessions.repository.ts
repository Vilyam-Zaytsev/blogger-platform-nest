import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/entities/session/session.entity';
import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { session } from 'passport';

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

  async getByDeviceId(deviceId: string): Promise<SessionDocument | null> {
    return this.SessionModel.findOne({
      deviceId,
      deletedAt: null,
    });
  }

  async save(session: SessionDocument): Promise<string> {
    const resultSave: SessionDocument = await session.save();

    return resultSave._id.toString();
  }
}
