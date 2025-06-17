export class CreateCommentDto {
  postId: string;
  userId: string;
  content: string;
}

export class UpdateCommentDto {
  content: string;
}
