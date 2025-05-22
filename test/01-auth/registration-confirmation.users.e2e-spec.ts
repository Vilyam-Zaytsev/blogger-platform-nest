import request, { Response } from 'supertest';
import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';
import { TestDtoFactory } from '../helpers/test.dto-factory';
import { UsersTestManager } from '../managers/users.test-manager';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';
import { TestLoggers } from '../helpers/test.loggers';
import { AppTestManager } from '../managers/app.test-manager';
import { AdminCredentials } from '../types';
import { Server } from 'http';
import { EmailService } from '../../src/modules/notifications/email.service';
import { EmailTemplate } from '../../src/modules/notifications/templates/types';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { UserDocument } from '../../src/modules/user-accounts/domain/user.entity';
import { ConfirmationStatus } from '../../src/modules/user-accounts/domain/email-confirmation.schema';

describe('AuthController - registrationConfirmation() (POST: /auth)', () => {
  let appTestManager: AppTestManager;
  let usersTestManager: UsersTestManager;
  let usersRepository: UsersRepository;
  let adminCredentials: AdminCredentials;
  // let cryptoService: CryptoService;
  let server: Server;
  let sendEmailMock: jest.Mock;
  // let spyOnGenerateUUID: jest.SpyInstance<string, []>;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();

    usersTestManager = new UsersTestManager(server, adminCredentials);
    usersRepository = appTestManager.app.get(UsersRepository);
    // cryptoService = appTestManager.app.get(CryptoService);

    sendEmailMock = jest
      .spyOn(EmailService.prototype, 'sendEmail')
      .mockResolvedValue() as jest.Mock<Promise<void>, [string, EmailTemplate]>;

    // spyOnGenerateUUID = jest.spyOn(cryptoService, 'generateUUID');
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();

    sendEmailMock.mockClear();
    // spyOnGenerateUUID.mockClear();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should be confirmed if the user has sent the correct verification code.', async () => {
    const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

    await usersTestManager.registration(dto);

    const user_notConfirmed: UserDocument | null =
      await usersRepository.getByEmail(dto.email);

    expect(user_notConfirmed).not.toBeNull();

    if (!user_notConfirmed) {
      throw new Error(
        'Test №1: AuthController - registrationConfirmation() (POST: /auth): User not found',
      );
    }

    expect(user_notConfirmed).toEqual(
      expect.objectContaining({
        emailConfirmation: expect.objectContaining({
          confirmationCode: expect.any(String),
          expirationDate: expect.any(Date),
          confirmationStatus: ConfirmationStatus.NotConfirmed,
        }),
      }),
    );

    // const [{ value: capturedConfirmationCode }]: { value?: string }[] =
    //   spyOnGenerateUUID.mock.results;

    const resRegistrationConfirmation: Response = await request(server)
      .post(`/${GLOBAL_PREFIX}/auth/registration-confirmation`)
      .send({
        code: user_notConfirmed.emailConfirmation.confirmationCode,
      })
      .expect(204);

    const user_confirmed: UserDocument | null =
      await usersRepository.getByEmail(dto.email);

    expect(user_confirmed).not.toBeNull();

    if (!user_confirmed) {
      throw new Error(
        'Test №1: AuthController - registrationConfirmation() (POST: /auth): User not found',
      );
    }

    expect(user_confirmed).toEqual(
      expect.objectContaining({
        emailConfirmation: expect.objectContaining({
          confirmationCode: null,
          expirationDate: null,
          confirmationStatus: ConfirmationStatus.Confirmed,
        }),
      }),
    );

    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    TestLoggers.logE2E(
      resRegistrationConfirmation.body,
      resRegistrationConfirmation.statusCode,
      'Test №1: AuthController - registrationConfirmation() (POST: /auth)',
    );
  });
});
