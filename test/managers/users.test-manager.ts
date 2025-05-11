import { PaginatedViewDto } from '../../src/core/dto/paginated.view-dto';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/user.view-dto';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { Server } from 'http';
import { TestUtils } from '../helpers/test.utils';
import { ConfigService } from '@nestjs/config';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

export class UsersTestManager {
  constructor(
    private readonly app: INestApplication,
    private readonly configService: ConfigService,
  ) {}

  async getAll(
    query: Partial<GetUsersQueryParams> = {},
  ): Promise<PaginatedViewDto<UserViewDto>> {
    const response: Response = await request(this.app.getHttpServer() as Server)
      .get(`/${GLOBAL_PREFIX}/users`)
      .query(query)
      .set(
        'Authorization',
        TestUtils.encodingAdminDataInBase64(
          this.configService.get('ADMIN_LOGIN')!,
          this.configService.get('ADMIN_PASSWORD')!,
        ),
      )
      .expect(200);

    return response.body as PaginatedViewDto<UserViewDto>;
  }
}
