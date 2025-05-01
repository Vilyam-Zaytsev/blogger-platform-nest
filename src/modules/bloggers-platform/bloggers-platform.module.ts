import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from './domain/blog.entity';
import { BlogsController } from './api/blogs.controller';
import { BlogsRepository } from './infrastructure/blogs.repository';
import { BlogsQueryRepository } from './infrastructure/query/blogs.query-repository';
import { CreateBlogUseCase } from './application/usecases/create-blog.usecase';
import { UpdateBlogUseCase } from './application/usecases/update-blog.usecase';
import { DeleteBlogUseCase } from './application/usecases/delete-blog.usecase';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Blog.name, schema: BlogSchema }]),
  ],
  controllers: [BlogsController],
  providers: [
    BlogsRepository,
    BlogsQueryRepository,
    CreateBlogUseCase,
    UpdateBlogUseCase,
    DeleteBlogUseCase,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
