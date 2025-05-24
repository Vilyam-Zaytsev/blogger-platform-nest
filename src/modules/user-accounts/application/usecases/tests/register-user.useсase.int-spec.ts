// import { AdminCredentials } from '../../../../../../test/types';
// import { Server } from 'http';
// import { AppTestManager } from '../../../../../../test/managers/app.test-manager';
// import { UsersTestManager } from '../../../../../../test/managers/users.test-manager';
// import { TestDtoFactory } from '../../../../../../test/helpers/test.dto-factory';
// import { CryptoService } from '../../crypto.service';
// import { TestLoggers } from '../../../../../../test/helpers/test.loggers';
// import { UsersRepository } from '../../../infrastructure/users.repository';
// import { UserDocument } from '../../../domain/user.entity';
// import { ConfirmationStatus } from '../../../domain/email-confirmation.schema';
// import { CreateUserDto } from '../../../dto/create-user.dto';
// import { RegisterUserUseCase } from '../register-user.useсase';
// import { EmailService } from '../../../../notifications/email.service';
// import { EmailTemplate } from '../../../../notifications/templates/types';
//
// describe('RegisterUserUseCase (integration)', () => {
//   let appTestManager: AppTestManager;
//   let registerUserUseCase: RegisterUserUseCase;
//   let usersTestManager: UsersTestManager;
//   let usersRepository: UsersRepository;
//   let adminCredentials: AdminCredentials;
//   let server: Server;
//
//   let comparePasswordMock: jest.SpyInstance;
//   let generateUUIDMock: jest.SpyInstance;
//   let sendEmailMock: jest.SpyInstance;
//
//   beforeAll(async () => {
//     appTestManager = new AppTestManager();
//     await appTestManager.init();
//
//     registerUserUseCase =
//       appTestManager.app.get<RegisterUserUseCase>(RegisterUserUseCase);
//     usersRepository = appTestManager.app.get<UsersRepository>(UsersRepository);
//     adminCredentials = appTestManager.getAdminData();
//     server = appTestManager.getServer();
//     usersTestManager = new UsersTestManager(server, adminCredentials);
//
//     sendEmailMock = jest
//       .spyOn(EmailService.prototype, 'sendEmail')
//       .mockResolvedValue() as jest.Mock<Promise<void>, [string, EmailTemplate]>;
//
//     generateUUIDMock = jest
//       .spyOn(CryptoService.prototype, 'generateUUID')
//       .mockImplementation((): string => {
//         return `randomUUID`;
//       });
//
//     comparePasswordMock = jest
//       .spyOn(CryptoService.prototype, 'createPasswordHash')
//       .mockImplementation(async (password: string): Promise<string> => {
//         return `hashPassword.${password}`;
//       });
//   });
//
//   beforeEach(async () => {
//     await appTestManager.cleanupDb();
//
//     comparePasswordMock.mockClear();
//     generateUUIDMock.mockClear();
//     sendEmailMock.mockClear();
//   });
//
//   afterAll(async () => {
//     await appTestManager.close();
//   });
//
//   it('should register the user in the system if the entered data is correct', async () => {
//     const [dto]: CreateUserDto[] = TestDtoFactory.generateUserInputDto(1);
//
//     await registerUserUseCase.execute(dto);
//
//     expect(resultCreateUser).toEqual(expect.any(String));
//
//     const user: UserDocument =
//       await usersRepository.getByIdOrNotFoundFail(resultCreateUser);
//
//     expect(user.emailConfirmation).toMatchObject({
//       confirmationCode: null,
//       expirationDate: null,
//       confirmationStatus: ConfirmationStatus.Confirmed,
//     });
//
//     expect(generateUUIDMock).toHaveBeenCalled();
//     expect(generateUUIDMock).toHaveBeenCalledTimes(1);
//     expect(comparePasswordMock).toHaveBeenCalled();
//     expect(comparePasswordMock).toHaveBeenCalledTimes(1);
//
//     TestLoggers.logUnit(resultCreateUser, 'Test №1: CreateUserByAdminUseCase');
//   });
// });
