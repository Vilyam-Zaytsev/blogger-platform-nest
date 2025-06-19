import { IsEmail, IsString, Matches } from 'class-validator';
import { emailConstraints } from '../../../domain/entities/user/user.entity';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class PasswordRecoveryInputDto {
  @IsString()
  @IsEmail()
  @Matches(emailConstraints.match)
  @Trim()
  email: string;
}
