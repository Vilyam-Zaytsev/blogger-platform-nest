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

export class UsersTestManager {
  constructor(
    private readonly server: Server,
    private readonly adminCredentials: AdminCredentials,
  ) {}

  async createUser(quantity: number): Promise<UserViewDto[]> {
    const newUsers: UserViewDto[] = [];
    const dtos: UserInputDto[] = TestDtoFactory.generateUserInputDto(quantity);

    for (let i = 0; i < quantity; i++) {
      const user: UserInputDto = dtos[i];

      const response: Response = await request(this.server)
        .post(`/${GLOBAL_PREFIX}/users`)
        .send(user)
        .set(
          'Authorization',
          TestUtils.encodingAdminDataInBase64(
            this.adminCredentials.login,
            this.adminCredentials.password,
          ),
        )
        .expect(201);

      const newUser: UserViewDto = response.body as UserViewDto;

      expect(typeof newUser.id).toBe('string');
      expect(new Date(newUser.createdAt).toString()).not.toBe('Invalid Date');
      expect(newUser.login).toBe(user.login);
      expect(newUser.email).toBe(user.email);

      newUsers.push(newUser);
    }

    return newUsers;
  }

  async registration(dto: UserInputDto): Promise<Response> {
    return await request(this.server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send(dto)
      .expect(204);
  }

  async login(loginsOrEmails: string[]): Promise<TestResultLogin[]> {
    const resultLogin: TestResultLogin[] = [];

    for (let i = 0; i < loginsOrEmails.length; i++) {
      const res: Response = await request(this.server)
        .post(`/${GLOBAL_PREFIX}/auth/login`)
        .send({
          loginOrEmail: loginsOrEmails[i],
          password: 'qwerty',
        })
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          accessToken: expect.any(String),
        }),
      );

      const body = res.body as { accessToken: string };

      const authTokens = {
        accessToken: body.accessToken,
        refreshToken: res.headers['set-cookie'][0].split(';')[0].split('=')[1],
      };

      const result = {
        loginOrEmail: loginsOrEmails[i],
        authTokens,
      };

      resultLogin.push(result);
    }

    return resultLogin;
  }

  async getAll(
    query: Partial<GetUsersQueryParams> = {},
  ): Promise<PaginatedViewDto<UserViewDto>> {
    const response: Response = await request(this.server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .query(query)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          this.adminCredentials.login,
          this.adminCredentials.password,
        ),
      )
      .expect(200);

    return response.body as PaginatedViewDto<UserViewDto>;
  }

  async passwordRecovery(email: string) {
    await request(this.server)
      .post(`/${GLOBAL_PREFIX}/auth/password-recovery`)
      .send({
        email,
      })
      .expect(204);
  }
}
