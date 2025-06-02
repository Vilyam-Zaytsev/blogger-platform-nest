import request, { Response } from 'supertest';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials, TestSearchFilter } from '../types';
import { Server } from 'http';
import { BlogViewDto } from 'src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { BlogsTestManager } from '../managers/blogs.test-manager';
import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { HttpStatus } from '@nestjs/common';
import { Filter } from '../helpers/filter';
import {
  BlogsSortBy,
  GetBlogsQueryParams,
} from '../../src/modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';

describe('BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let adminCredentials: AdminCredentials;
  let testLoggingEnabled: boolean;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();
    testLoggingEnabled = appTestManager.coreConfig.testLoggingEnabled;

    blogsTestManager = new BlogsTestManager(server, adminCredentials);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should use default pagination values when none are provided by the client.', async () => {
    const createdBlogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(
      createdBlogs,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 2,
      page: 1,
      pageSize: 10,
      totalCount: 12,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetRequest.items).toHaveLength(10);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №1: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(1).', async () => {
    const createdBlogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    query.sortBy = BlogsSortBy.Name;
    query.sortDirection = SortDirection.Ascending;
    query.pageNumber = 2;
    query.pageSize = 3;

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(
      createdBlogs,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 4,
      page: 2,
      pageSize: 3,
      totalCount: 12,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetRequest.items).toHaveLength(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №2: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(2).', async () => {
    const createdBlogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    query.sortBy = BlogsSortBy.CreatedAt;
    query.sortDirection = SortDirection.Descending;
    query.pageNumber = 6;
    query.pageSize = 2;

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(
      createdBlogs,
    )
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 6,
      page: 6,
      pageSize: 2,
      totalCount: 12,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetRequest.items).toHaveLength(2);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №3: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(3).', async () => {
    const createdBlogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    query.sortBy = BlogsSortBy.Name;
    query.sortDirection = SortDirection.Ascending;
    query.pageNumber = 2;
    query.pageSize = 1;
    query.searchNameTerm = 'g1';

    const searchFilter: TestSearchFilter = {
      name: query.searchNameTerm,
    };

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetRequest: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(
      createdBlogs,
    )
      .filter(searchFilter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetRequest).toEqual({
      pagesCount: 3,
      page: 2,
      pageSize: 1,
      totalCount: 3,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetRequest.items).toHaveLength(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №4: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });
});
