import { IsStringWithTrimDecorator } from '../../../../../core/decorators/validation/is-string-with-trim.decorator';

export const commentConstraints = {
  minLength: 20,
  maxLength: 300,
};

export class CommentInputDto {
  @IsStringWithTrimDecorator(
    commentConstraints.minLength,
    commentConstraints.maxLength,
  )
  content: string;
}
