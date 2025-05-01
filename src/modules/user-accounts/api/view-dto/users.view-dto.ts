import { UserDocument } from '../../domain/user.entity';

export class UsersViewDto {
  id: string;
  email: string;
  login: string;
  createdAt: string;

  static mapToView(user: UserDocument): UsersViewDto {
    const dto = new this();

    dto.id = user._id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt.toISOString();

    return dto;
  }
}
