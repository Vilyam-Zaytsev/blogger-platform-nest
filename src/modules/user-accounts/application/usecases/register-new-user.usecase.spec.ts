import { RegisterNewUserUseCase } from './register-new-user.usecase';
import { UsersRepository } from '../../infrastructure/users.repository';
import { BcryptService } from '../bcrypt.service';
import { User, UserDocument, UserModelType } from '../../domain/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CreateUserByAdminUseCase } from './create-user-by-admin.usecase';
import { CreateUserDto } from '../../dto/create-user.dto';
import { randomUUID } from 'node:crypto';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

describe('RegisterNewUserUseCase', () => {
  let useCase: RegisterNewUserUseCase;
  let usersRepository: UsersRepository;
  let bcryptService: BcryptService;
  let UserModel: UserModelType;
  const UserDocument: Partial<UserDocument> = {};

  const mockHashedPassword = 'hashedPassword';
  const mockUserId = 'mockUserId';
  const mockConfirmationCode = 'mocked-uuid';
  const mockExpirationDate = 'mocked-expiration-date';

  beforeEach(async () => {
    bcryptService = {
      generateHash: jest.fn((): string => mockHashedPassword),
    } as unknown as jest.Mocked<BcryptService>;

    usersRepository = {
      save: jest.fn((): string => mockUserId),
    } as unknown as jest.Mocked<UsersRepository>;

    UserModel = {
      createInstance: jest.fn((): UserDocument => UserDocument as UserDocument),
    } as unknown as jest.Mocked<UserModelType>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserByAdminUseCase,
        { provide: BcryptService, useValue: bcryptService },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: getModelToken(User.name), useValue: UserModel },
      ],
    }).compile();

    useCase = module.get(CreateUserByAdminUseCase);
  });

  it('should register a new user', async () => {
    const dto: CreateUserDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      password: 'qwerty',
    };

    (bcryptService.generateHash as jest.Mock).mockResolvedValue(
      mockHashedPassword,
    );
    (UserModel.createInstance as jest.Mock).mockReturnValue(UserDocument);
    (usersRepository.save as jest.Mock).mockResolvedValue(mockUserId);
    (randomUUID as jest.Mock).mockReturnValue(mockConfirmationCode);

    const result: string = await useCase.execute(dto);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(bcryptService.generateHash).toHaveBeenCalledWith(dto.password);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(UserModel.createInstance).toHaveBeenCalledWith({
      email: dto.email,
      login: dto.login,
      passwordHash: mockHashedPassword,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(usersRepository.save).toHaveBeenCalledWith(UserDocument);
    expect(result).toBe(mockUserId);
  });
});
