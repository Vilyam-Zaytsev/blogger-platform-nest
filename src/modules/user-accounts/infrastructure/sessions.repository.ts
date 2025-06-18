import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import {
  Session,
  SessionDocument,
  SessionModelType,
} from '../domain/entities/session/session.entity';

@Injectable()
export class SessionsRepository {
  constructor(
    @InjectModel(Session.name) private readonly SessionModel: SessionModelType,
  ) {}

  // async getByIdOrNotFoundFail(id: string): Promise<UserDocument> {
  //   const user: UserDocument | null = await this.UserModel.findOne({
  //     _id: id,
  //     deletedAt: null,
  //   });
  //
  //   if (!user) {
  //     throw new DomainException({
  //       code: DomainExceptionCode.NotFound,
  //       message: `The user with ID (${id}) does not exist`,
  //     });
  //   }
  //
  //   return user;
  // }
  //
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
