import { IsStringWithTrimDecorator } from '../../../../../core/decorators/validation/is-string-with-trim.decorator';
import {
  contentConstraints,
  shortDescriptionConstraints,
  titleConstraints,
} from '../../domain/post.entity';

export class CreatePostForBlogInputDto {
  @IsStringWithTrimDecorator(1, titleConstraints.maxLength)
  title: string;

  @IsStringWithTrimDecorator(1, shortDescriptionConstraints.maxLength)
  shortDescription: string;

  @IsStringWithTrimDecorator(1, contentConstraints.maxLength)
  content: string;
}
