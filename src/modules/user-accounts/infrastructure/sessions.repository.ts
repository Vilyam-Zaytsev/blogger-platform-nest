import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/entities/session/session.entity';
import { UserDocument } from '../domain/entities/user/user.entity';
import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly SessionModel: SessionModelType,
  ) {}

  async getByUserId(userId: string): Promise<SessionDocument[]> {
    return this.SessionModel.find({
      userId,
      deletedAt: null,
    });
  }

  // async getByConfirmationCode(
  //   confirmationCode: string,
  // ): Promise<UserDocument | null> {
  //   return this.UserModel.findOne({
  //     'emailConfirmation.confirmationCode': confirmationCode,
  //     deletedAt: null,
  //   });
  // }
  //
  // async getByRecoveryCode(recoveryCode: string): Promise<UserDocument | null> {
  //   return this.UserModel.findOne({
  //     'passwordRecovery.recoveryCode': recoveryCode,
  //     deletedAt: null,
  //   });
  // }
  //
  // async getByLogin(login: string): Promise<UserDocument | null> {
  //   return this.UserModel.findOne({
  //     login,
  //     deletedAt: null,
  //   });
  // }
  //
  // async getByEmail(email: string): Promise<UserDocument | null> {
  //   return this.UserModel.findOne({
  //     email,
  //     deletedAt: null,
  //   });
  // }
  //
  // async getByIds(ids: string[]): Promise<UserDocument[]> {
  //   return this.UserModel.find({ _id: { $in: ids } });
  // }

  async save(session: SessionDocument): Promise<string> {
    const resultSave: SessionDocument = await session.save();

    return resultSave._id.toString();
  }
}
