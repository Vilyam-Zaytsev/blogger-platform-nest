import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { passwordConstraints } from '../../../domain/entities/user/user.entity';

export class NewPasswordInputDto {
  @IsStringWithTrim(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  newPassword: string;
  @IsStringWithTrim(1, 1000)
  recoveryCode: string;
}
