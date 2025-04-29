import { UserDocument } from '../../domain/user.entity';

class UsersViewDto {
  id: string;
  email: string;
  login: string;
  createdAt: string;

  static mapToView(user: UserDocument): UsersViewDto {
    const dto = new this();

    dto.id = String(user._id);
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt.toISOString();

    return dto;
  }
}

export { UsersViewDto };
