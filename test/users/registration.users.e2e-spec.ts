import request, { Response } from 'supertest';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import {
  User,
  UserDocument,
} from '../../src/modules/user-accounts/domain/user.entity';
import { EmailService } from '../../src/modules/notifications/email.service';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { ConfirmationStatus } from '../../src/modules/user-accounts/domain/email-confirmation.schema';
import { ObjectId } from 'mongodb';

describe('AuthController - registration() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let adminCredentials: AdminCredentials;
  let server: Server;
  let usersRepository: UsersRepository;
  let sendEmailMock: any;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();

    usersTestManager = new UsersTestManager(server, adminCredentials);
    usersRepository = appTestManager.app.get<UsersRepository>(UsersRepository);

    sendEmailMock = jest
      .spyOn(EmailService.prototype, 'sendEmail')
      .mockResolvedValue();
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should be registered if the user has sent the correct data (login or email address and password).', async () => {
    const dto: UserInputDto = TestDtoFactory.generateUserInputDto(1)[0];

    const resRegistration: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration`)
      .send({
        login: dto.login,
        email: dto.email,
        password: dto.password,
      })
      .expect(204);

    const user: UserDocument | null = await usersRepository.getByEmail(
      dto.email,
    );

    expect(user).not.toBeNull();

    const userObject: User = user!.toObject();

    expect(userObject).toEqual({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      _id: expect.any(ObjectId),
      login: dto.login,
      email: dto.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      passwordHash: expect.any(String),
      passwordRecovery: {
        expirationDate: null,
        recoveryCode: null,
      },
      emailConfirmation: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        confirmationCode: expect.any(String),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expirationDate: expect.any(Date),
        confirmationStatus: ConfirmationStatus.NotConfirmed,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      createdAt: expect.any(Date),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updatedAt: expect.any(Date),
      deletedAt: null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      __v: expect.any(Number),
    });

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    TestLoggers.logE2E(
      resRegistration.body,
      resRegistration.statusCode,
      'Test №1: AuthController - registration() (POST: /auth)',
    );
  });
});
