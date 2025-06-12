import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';
import {
  emailConstraints,
  loginConstraints,
  passwordConstraints,
} from '../../domain/user.entity';
import { IsEmail, IsString, Matches } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

export class UserInputDto {
  @Matches(loginConstraints.match)
  @IsStringWithTrim(loginConstraints.minLength, loginConstraints.maxLength)
  login: string;

  @IsString()
  @IsEmail()
  @Matches(emailConstraints.match)
  @Trim()
  email: string;

  @IsStringWithTrim(
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;
}
