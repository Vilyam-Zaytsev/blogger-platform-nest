import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { DomainException } from '../../../core/exceptions/damain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}
  async getByIdOrNotFoundFail(id: string): Promise<UserDocument> {
    const user: UserDocument | null = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    //TODO: правильно ли я понял, что в этом случае выкидывается доменное исключение?
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: `The user with ID (${id}) does not exist`,
      });
    }

    return user;
  }

  async getByLogin(login: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ login });
  }

  async getByEmail(email: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({ email });
  }

  async save(user: UserDocument): Promise<string> {
    const resultSave: UserDocument = await user.save();

    return resultSave._id.toString();
  }
}
