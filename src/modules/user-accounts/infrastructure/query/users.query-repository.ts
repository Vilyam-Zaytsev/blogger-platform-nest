import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { UsersViewDto } from '../../api/view-dto/users.view-dto';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async getUserById(id: string): Promise<UsersViewDto> {
    const user: UserDocument | null = await this.UserModel.findOne({
      _id: id,
      deleted: null,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UsersViewDto.mapToViewModel(user);
  }
}
