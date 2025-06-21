import { IsStringWithTrimDecorator } from '../../../../../core/decorators/validation/is-string-with-trim.decorator';

export class RegistrationConfirmationCodeInputDto {
  @IsStringWithTrimDecorator(1, 1000)
  code: string;
}
