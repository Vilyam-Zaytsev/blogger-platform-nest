import { IsStringWithTrimDecorator } from '../../../../../core/decorators/validation/is-string-with-trim.decorator';
import { passwordConstraints } from '../../../domain/entities/user/user.entity';

export class LoginInputDto {
  @IsStringWithTrimDecorator(3, 100)
  loginOrEmail: string;

  @IsStringWithTrimDecorator(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;
}
