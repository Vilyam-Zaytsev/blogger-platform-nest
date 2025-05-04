import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { NotFoundException } from '@nestjs/common';

export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}
  async getByIdOrNotFoundFail(id: string): Promise<UserDocument> {
    const user: UserDocument | null = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async save(user: UserDocument): Promise<string> {
    const resultSave: UserDocument = await user.save();

    return resultSave._id.toString();
  }
}
