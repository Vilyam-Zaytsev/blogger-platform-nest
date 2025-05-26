import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  descriptionConstraints,
  nameConstraints,
  websiteUrlConstraints,
} from '../../domain/blog.entity';
import { IsUrl, Matches } from 'class-validator';

export class BlogInputDto {
  @IsStringWithTrim(1, nameConstraints.maxLength)
  name: string;

  @IsStringWithTrim(1, descriptionConstraints.maxLength)
  description: string;

  @IsStringWithTrim(1, websiteUrlConstraints.maxLength)
  @IsUrl()
  @Matches(websiteUrlConstraints.match)
  websiteUrl: string;
}
