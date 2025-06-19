import { UserDocument } from '../../domain/entities/user/user.entity';
import { OmitType } from '@nestjs/swagger';

export class UserViewDto {
  id: string;
  email: string;
  login: string;
  createdAt: string;

  static mapToView(user: UserDocument): UserViewDto {
    const dto = new this();

    dto.id = user._id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt.toISOString();

    return dto;
  }
}

export class MeViewDto extends OmitType(UserViewDto, [
  'createdAt',
  'id',
] as const) {
  userId: string;

  static mapToView(user: UserDocument): MeViewDto {
    const dto = new this();

    dto.email = user.email;
    dto.login = user.login;
    dto.userId = user._id.toString();

    return dto;
  }
}
