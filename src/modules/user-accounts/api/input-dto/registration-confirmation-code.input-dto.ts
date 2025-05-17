import { IsStringWithTrim } from '../../../../core/decorators/validation/is-string-with-trim';

export class RegistrationConfirmationCodeInputDto {
  @IsStringWithTrim(1, 1000)
  code: string;
}
