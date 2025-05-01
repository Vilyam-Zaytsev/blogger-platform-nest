// import { BlogDocument } from '../../domain/blog.entity';
// import { BlogViewDto } from '../../../blogs/api/view-dto/blog-view.dto';
//
// export class PostViewDto {
//   id: string;
//   title: string;
//   shortDescription: string;
//   content: string;
//   blogId: string;
//   blogName: string;
//   extendedLikesInfo: ExtendedLikesInfo;
//   createdAt: string;
//
//   static mapToView(blog: BlogDocument): BlogViewDto {
//     const dto = new this();
//
//     dto.id = blog._id.toString();
//     dto.name = blog.name;
//     dto.description = blog.description;
//     dto.websiteUrl = blog.websiteUrl;
//     dto.createdAt = blog.createdAt.toISOString();
//     dto.isMembership = blog.isMembership;
//
//     return dto;
//   }
// }
//
// type ExtendedLikesInfo = {
//   likesCount: number;
//   dislikesCount: number;
//   myStatus: LikeStatus;
//   newestLikes: LikeDetailsViewModel[];
// };
