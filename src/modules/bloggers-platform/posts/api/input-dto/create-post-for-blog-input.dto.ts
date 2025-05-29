import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';
import {
  contentConstraints,
  shortDescriptionConstraints,
  titleConstraints,
} from '../../domain/post.entity';

export class CreatePostForBlogInputDto {
  @IsStringWithTrim(1, titleConstraints.maxLength)
  title: string;

  @IsStringWithTrim(1, shortDescriptionConstraints.maxLength)
  shortDescription: string;

  @IsStringWithTrim(1, contentConstraints.maxLength)
  content: string;
}
