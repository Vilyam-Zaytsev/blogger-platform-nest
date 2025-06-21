import { IsStringWithTrimDecorator } from '../../../../../core/decorators/validation/is-string-with-trim.decorator';
import {
  descriptionConstraints,
  nameConstraints,
  websiteUrlConstraints,
} from '../../domain/blog.entity';
import { IsUrl, Matches } from 'class-validator';

export class BlogInputDto {
  @IsStringWithTrimDecorator(1, nameConstraints.maxLength)
  name: string;

  @IsStringWithTrimDecorator(1, descriptionConstraints.maxLength)
  description: string;

  @IsStringWithTrimDecorator(1, websiteUrlConstraints.maxLength)
  @IsUrl()
  @Matches(websiteUrlConstraints.match)
  websiteUrl: string;
}
