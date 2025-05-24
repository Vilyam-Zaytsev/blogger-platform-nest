import { AdminCredentials } from '../../../../../../test/types';
import { Server } from 'http';
import { AppTestManager } from '../../../../../../test/managers/app.test-manager';
import { UsersTestManager } from '../../../../../../test/managers/users.test-manager';
import { UserInputDto } from '../../../api/input-dto/user.input-dto';
import { TestDtoFactory } from '../../../../../../test/helpers/test.dto-factory';
import { CryptoService } from '../../crypto.service';
import { CreateUserByAdminUseCase } from '../create-user-by-admin.usecase';
import { TestLoggers } from '../../../../../../test/helpers/test.loggers';
import { UsersRepository } from '../../../infrastructure/users.repository';
import { UserDocument } from '../../../domain/user.entity';
import { ConfirmationStatus } from '../../../domain/email-confirmation.schema';
import { DomainException } from '../../../../../core/exceptions/damain-exceptions';
import { PaginatedViewDto } from '../../../../../core/dto/paginated.view-dto';
import { UserViewDto } from '../../../api/view-dto/user.view-dto';

describe('CreateUserByAdminUseCase (integration)', () => {
  let appTestManager: AppTestManager;
  let createUserByAdminUseCase: CreateUserByAdminUseCase;
  let usersTestManager: UsersTestManager;
  let usersRepository: UsersRepository;
  let adminCredentials: AdminCredentials;
  let server: Server;
  let comparePasswordMock: jest.SpyInstance;
  let generateUUIDMock: jest.SpyInstance;

  beforeAll(async () => {
    appTestManager = new AppTestManager();
    await appTestManager.init();

    createUserByAdminUseCase = appTestManager.app.get<CreateUserByAdminUseCase>(
      CreateUserByAdminUseCase,
    );
    usersRepository = appTestManager.app.get<UsersRepository>(UsersRepository);
    adminCredentials = appTestManager.getAdminData();
    server = appTestManager.getServer();
    usersTestManager = new UsersTestManager(server, adminCredentials);

    generateUUIDMock = jest
      .spyOn(CryptoService.prototype, 'generateUUID')
      .mockImplementation((): string => {
        return `randomUUID`;
      });

    comparePasswordMock = jest
      .spyOn(CryptoService.prototype, 'createPasswordHash')
      .mockImplementation(async (password: string): Promise<string> => {
        return `hashPassword.${password}`;
      });
  });

  beforeEach(async () => {
    await appTestManager.cleanupDb();

    comparePasswordMock.mockClear();
    generateUUIDMock.mockClear();
  });

  afterAll(async () => {
    await appTestManager.close();
  });

  it('should create a user with a verified email if the input data is valid', async () => {
    const [dto]: UserInputDto[] = TestDtoFactory.generateUserInputDto(1);

    const resultCreateUser: string =
      await createUserByAdminUseCase.execute(dto);

    expect(resultCreateUser).toEqual(expect.any(String));

    const user: UserDocument =
      await usersRepository.getByIdOrNotFoundFail(resultCreateUser);

    expect(user.emailConfirmation).toMatchObject({
      confirmationCode: null,
      expirationDate: null,
      confirmationStatus: ConfirmationStatus.Confirmed,
    });

    expect(generateUUIDMock).toHaveBeenCalled();
    expect(generateUUIDMock).toHaveBeenCalledTimes(1);
    expect(comparePasswordMock).toHaveBeenCalled();
    expect(comparePasswordMock).toHaveBeenCalledTimes(1);

    TestLoggers.logUnit(resultCreateUser, 'Test №1: CreateUserByAdminUseCase');
  });

  it('should throw an error if a user with such an email address already exists', async () => {
    const [dto_1, dto_2]: UserInputDto[] =
      TestDtoFactory.generateUserInputDto(2);

    await createUserByAdminUseCase.execute(dto_1);

    await expect(
      createUserByAdminUseCase.execute({
        email: dto_1.email,
        login: dto_2.login,
        password: dto_2.password,
      }),
    ).rejects.toThrow(DomainException);

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(1);

    expect(generateUUIDMock).toHaveBeenCalled();
    expect(generateUUIDMock).toHaveBeenCalledTimes(1);
    expect(comparePasswordMock).toHaveBeenCalled();
    expect(comparePasswordMock).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if a user with such an login already exists', async () => {
    const [dto_1, dto_2]: UserInputDto[] =
      TestDtoFactory.generateUserInputDto(2);

    await createUserByAdminUseCase.execute(dto_1);

    await expect(
      createUserByAdminUseCase.execute({
        email: dto_2.email,
        login: dto_1.login,
        password: dto_2.password,
      }),
    ).rejects.toThrow(DomainException);

    const { items }: PaginatedViewDto<UserViewDto> =
      await usersTestManager.getAll();

    expect(items).toHaveLength(1);

    expect(generateUUIDMock).toHaveBeenCalled();
    expect(generateUUIDMock).toHaveBeenCalledTimes(1);
    expect(comparePasswordMock).toHaveBeenCalled();
    expect(comparePasswordMock).toHaveBeenCalledTimes(1);
  });
});
