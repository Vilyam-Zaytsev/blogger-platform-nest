import { IsStringWithTrimDecorator } from '../../../../core/decorators/validation/is-string-with-trim.decorator';
import {
  emailConstraints,
  loginConstraints,
  passwordConstraints,
} from '../../domain/entities/user/user.entity';
import { IsEmail, IsString, Matches } from 'class-validator';
import { TrimDecorator } from '../../../../core/decorators/transform/trim.decorator';

export class UserInputDto {
  @Matches(loginConstraints.match)
  @IsStringWithTrimDecorator(
    loginConstraints.minLength,
    loginConstraints.maxLength,
  )
  login: string;

  @IsString()
  @IsEmail()
  @Matches(emailConstraints.match)
  @TrimDecorator()
  email: string;

  @IsStringWithTrimDecorator(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;
}
