import { IsStringWithTrimDecorator } from '../../../../../core/decorators/validation/is-string-with-trim.decorator';
import { passwordConstraints } from '../../../domain/entities/user/user.entity';

export class NewPasswordInputDto {
  @IsStringWithTrimDecorator(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  newPassword: string;
  @IsStringWithTrimDecorator(1, 1000)
  recoveryCode: string;
}
