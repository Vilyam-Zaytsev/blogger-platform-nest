import { CreateUserByAdminUseCase } from './create-user-by-admin.usecase';
import { BcryptService } from '../bcrypt.service';
import { UsersRepository } from '../../infrastructure/users.repository';
import { User, UserModelType } from '../../domain/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

describe('CreateUserByAdminUseCase', () => {
  let useCase: CreateUserByAdminUseCase;
  let bcryptService: jest.Mocked<BcryptService>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let userModel: jest.Mocked<UserModelType>;

  beforeEach(async () => {
    bcryptService = {
      generateHash: jest.fn(),
    } as unknown as jest.Mocked<BcryptService>;

    usersRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    userModel = {
      createInstance: jest.fn(),
    } as unknown as jest.Mocked<UserModelType>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserByAdminUseCase,
        { provide: BcryptService, useValue: bcryptService },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    useCase = module.get(CreateUserByAdminUseCase);
  });

  it('should create user, hash password, and return saved userId ', async () => {});
});
