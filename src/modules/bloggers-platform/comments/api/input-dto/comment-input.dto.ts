import { IsStringWithTrim } from '../../../../../core/decorators/validation/is-string-with-trim';

export const commentConstraints = {
  minLength: 20,
  maxLength: 300,
};

export class CommentInputDto {
  @IsStringWithTrim(commentConstraints.minLength, commentConstraints.maxLength)
  content: string;
}
