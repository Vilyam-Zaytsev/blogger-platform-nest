export class CreateBlogDto {
  name: string;
  description: string;
  websiteUrl: string;
}

export class UpdateBlogDto extends CreateBlogDto {}
