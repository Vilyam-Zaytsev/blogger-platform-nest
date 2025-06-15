import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './blogs/domain/blog.entity';
import { BlogsController } from './blogs/api/blogs.controller';
import { BlogsRepository } from './blogs/infrastructure/blogs.repository';
import { BlogsQueryRepository } from './blogs/infrastructure/query/blogs.query-repository';
import { CreateBlogUseCase } from './blogs/application/usecases/create-blog.usecase';
import { UpdateBlogUseCase } from './blogs/application/usecases/update-blog.usecase';
import { DeleteBlogUseCase } from './blogs/application/usecases/delete-blog.usecase';
import { Post, PostSchema } from './posts/domain/post.entity';
import { PostsController } from './posts/api/posts.controller';
import { PostsRepository } from './posts/infrastructure/posts.repository';
import { PostsQueryRepository } from './posts/infrastructure/query/posts.query-repository';
import { CreatePostUseCase } from './posts/application/usecases/create-post.usecase';
import { UpdatePostUseCase } from './posts/application/usecases/update-post.usecase';
import { DeletePostUseCase } from './posts/application/usecases/delete-post.usecase';
import { GetPostsForBlogQueryHandler } from './blogs/application/queries/get-posts-for-blog.query-handler';
import { GetBlogQueryHandler } from './blogs/application/queries/get-blog.query-handler';
import { GetBlogsQueryHandler } from './blogs/application/queries/get-blogs.query-handler';
import { GetPostsQueryHandler } from './posts/application/queries/get-posts.query-handler';
import { GetPostQueryHandler } from './posts/application/queries/get-post.query-handler';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { ReactionsRepository } from './reactions/infrastructure/reactions-repository';
import { Reaction, ReactionSchema } from './reactions/domain/reaction.entity';
import { UpdatePostReactionUseCase } from './posts/application/usecases/update-post-reaction.usecase';
import { UpdateReactionUseCase } from './reactions/application/usecases/update-reactions.usecase';
import { CreateReactionUseCase } from './reactions/application/usecases/create-reaction-use.case';
import { CommentsQueryRepository } from './comments/infrastructure/query/comments.query-repository';
import { Comment, CommentSchema } from './comments/domain/comment.entity';
import { CreateCommentUseCase } from './comments/application/usecases/create-comment.usecase';
import { CommentsRepository } from './comments/infrastructure/comments-repository';
import { GetCommentQueryHandler } from './comments/application/queries/get-comment.query-handler';
import { CommentsController } from './comments/api/comments.controller';
import { GetCommentsQueryHandler } from './comments/application/queries/get-comments.query-handler';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Comment.name, schema: CommentSchema }]),
    MongooseModule.forFeature([
      { name: Reaction.name, schema: ReactionSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    //🔸 Blogs:
    //repo
    BlogsRepository,
    BlogsQueryRepository,
    //use-cases
    CreateBlogUseCase,
    UpdateBlogUseCase,
    DeleteBlogUseCase,
    //query-handlers
    GetBlogsQueryHandler,
    GetBlogQueryHandler,
    GetPostsForBlogQueryHandler,
    //🔸 Posts:
    //repo
    ReactionsRepository,
    PostsRepository,
    PostsQueryRepository,
    //use-cases
    CreatePostUseCase,
    CreateCommentUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    UpdatePostReactionUseCase,
    //query-handlers
    GetPostsQueryHandler,
    GetPostQueryHandler,
    //🔸 Comments:
    //repo
    CommentsRepository,
    CommentsQueryRepository,
    //query-handlers
    GetCommentQueryHandler,
    GetCommentsQueryHandler,
    //🔸 Likes:
    //use-cases
    UpdateReactionUseCase,
    CreateReactionUseCase,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
