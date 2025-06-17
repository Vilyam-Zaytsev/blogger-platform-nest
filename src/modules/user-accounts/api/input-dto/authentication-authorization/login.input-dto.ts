import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import { passwordConstraints } from '../../../domain/entities/user/user.entity';

export class LoginInputDto {
  @IsStringWithTrim(3, 100)
  loginOrEmail: string;

  @IsStringWithTrim(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;
}
