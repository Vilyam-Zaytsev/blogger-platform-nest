import { IsEmail, IsString, Matches } from 'class-validator';
import { emailConstraints } from '../../../domain/entities/user/user.entity';
import { TrimDecorator } from '../../../../../core/decorators/transform/trim.decorator';

export class PasswordRecoveryInputDto {
  @IsString()
  @IsEmail()
  @Matches(emailConstraints.match)
  @TrimDecorator()
  email: string;
}
