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
import { TestUtils } from '../helpers/test.utils';

describe('BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))', () => {
  let appTestManager: AppTestManager;
  let blogsTestManager: BlogsTestManager;
  let adminCredentials: AdminCredentials;
  let adminCredentialsInBase64: string;
  let testLoggingEnabled: boolean;
  let server: Server;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminCredentials();
    adminCredentialsInBase64 = TestUtils.encodingAdminDataInBase64(
      adminCredentials.login,
      adminCredentials.password,
    );
    server = appTestManager.getServer();
    testLoggingEnabled = appTestManager.coreConfig.testLoggingEnabled;

    blogsTestManager = new BlogsTestManager(server, adminCredentialsInBase64);
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should use default pagination values when none are provided by the client.', async () => {
    const blogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(blogs)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 2,
      page: 1,
      pageSize: 10,
      totalCount: 12,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetResponse.items).toHaveLength(10);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetBlogs.statusCode,
        'Test №1: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(1).', async () => {
    const blogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    query.sortBy = BlogsSortBy.Name;
    query.sortDirection = SortDirection.Ascending;
    query.pageNumber = 2;
    query.pageSize = 3;

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(blogs)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 4,
      page: 2,
      pageSize: 3,
      totalCount: 12,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetResponse.items).toHaveLength(3);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetBlogs.statusCode,
        'Test №2: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(2).', async () => {
    const blogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

    const query: GetBlogsQueryParams = new GetBlogsQueryParams();
    query.sortBy = BlogsSortBy.CreatedAt;
    query.sortDirection = SortDirection.Descending;
    query.pageNumber = 6;
    query.pageSize = 2;

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query(query)
      .expect(HttpStatus.OK);

    const bodyFromGetResponse: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(blogs)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 6,
      page: 6,
      pageSize: 2,
      totalCount: 12,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetResponse.items).toHaveLength(2);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetBlogs.statusCode,
        'Test №3: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });

  it('should use client-provided pagination values to return the correct subset of data(3).', async () => {
    const blogs: BlogViewDto[] = await blogsTestManager.createBlog(12);

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

    const bodyFromGetResponse: PaginatedViewDto<BlogViewDto> =
      resGetBlogs.body as PaginatedViewDto<BlogViewDto>;

    const filteredCreatedBlogs: BlogViewDto[] = new Filter<BlogViewDto>(blogs)
      .filter(searchFilter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .getResult();

    expect(bodyFromGetResponse).toEqual({
      pagesCount: 3,
      page: 2,
      pageSize: 1,
      totalCount: 3,
      items: filteredCreatedBlogs,
    });
    expect(bodyFromGetResponse.items).toHaveLength(1);

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        bodyFromGetResponse,
        resGetBlogs.statusCode,
        'Test №4: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });

  it('should return a 400 error if the client has passed invalid pagination values.', async () => {
    await blogsTestManager.createBlog(12);

    const resGetBlogs: Response = await request(server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query({
        pageNumber: 'xxx',
        pageSize: 'xxx',
        sortBy: 123,
        sortDirection: 'xxx',
        searchNameTerm: 123,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(resGetBlogs.body).toEqual({
      errorsMessages: [
        {
          field: 'sortDirection',
          message:
            'sortDirection must be one of the following values: asc, desc; Received value: xxx',
        },
        {
          field: 'pageSize',
          message:
            'pageSize must be a number conforming to the specified constraints; Received value: NaN',
        },
        {
          field: 'pageNumber',
          message:
            'pageNumber must be a number conforming to the specified constraints; Received value: NaN',
        },
        {
          field: 'sortBy',
          message:
            'sortBy must be one of the following values: createdAt, updatedAt, deletedAt, name; Received value: 123',
        },
      ],
    });

    if (testLoggingEnabled) {
      TestLoggers.logE2E(
        resGetBlogs.body,
        resGetBlogs.statusCode,
        'Test №5: BlogsController - getBlog() (GET: /blogs (pagination, sort, search in term))',
      );
    }
  });
});
