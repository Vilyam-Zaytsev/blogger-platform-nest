import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import request, { Response } from 'supertest';
import { Server } from 'http';
import { TestUtils } from '../helpers/test.utils';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { AdminCredentials, TestResultLogin } from '../types';
import { BlogViewDto } from '../../src/modules/bloggers-platform/blogs/api/view-dto/blog-view.dto';
import { GetBlogsQueryParams } from '../../src/modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';

export class BlogsTestManager {
  constructor(
    private readonly server: Server,
    private readonly adminCredentials: AdminCredentials,
  ) {}

  // async createUser(quantity: number): Promise<UserViewDto[]> {
  //   const newUsers: UserViewDto[] = [];
  //   const dtos: UserInputDto[] = TestDtoFactory.generateUserInputDto(quantity);
  //
  //   for (let i = 0; i < quantity; i++) {
  //     const user: UserInputDto = dtos[i];
  //
  //     const response: Response = await request(this.server)
  //       .post(`/${GLOBAL_PREFIX}/users`)
  //       .send(user)
  //       .set(
  //         'Authorization',
  //         TestUtils.encodingAdminDataInBase64(
  //           this.adminCredentials.login,
  //           this.adminCredentials.password,
  //         ),
  //       )
  //       .expect(201);
  //
  //     const newUser: UserViewDto = response.body as UserViewDto;
  //
  //     expect(typeof newUser.id).toBe('string');
  //     expect(new Date(newUser.createdAt).toString()).not.toBe('Invalid Date');
  //     expect(newUser.login).toBe(user.login);
  //     expect(newUser.email).toBe(user.email);
  //
  //     newUsers.push(newUser);
  //   }
  //
  //   return newUsers;
  // }

  async getAll(
    query: Partial<GetBlogsQueryParams> = {},
  ): Promise<PaginatedViewDto<BlogViewDto>> {
    const response: Response = await request(this.server)
      .get(`/${GLOBAL_PREFIX}/blogs`)
      .query(query)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          this.adminCredentials.login,
          this.adminCredentials.password,
        ),
      )
      .expect(200);

    return response.body as PaginatedViewDto<BlogViewDto>;
  }

  async getById(id: string): Promise<BlogViewDto> {
    const response: Response = await request(this.server)
      .get(`/${GLOBAL_PREFIX}/blogs/${id}`)
      .expect(200);

    return response.body as BlogViewDto;
  }
}
