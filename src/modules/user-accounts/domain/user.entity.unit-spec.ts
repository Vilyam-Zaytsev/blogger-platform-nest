import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { User, UserDocument } from './user.entity';
import {
  ConfirmationStatus,
  EmailConfirmation,
} from './email-confirmation.schema';
import { PasswordRecovery } from './password-recovery.schema';
import { TestLoggers } from '../../../../test/helpers/test.loggers';

describe('User Entity', () => {
  it('should correctly create a custom instance with nested entities using the "createInstance" method.', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      confirmationCode: 'test_confirmation-code',
      expirationDate: new Date(),
    };

    const user: UserDocument = User.createInstance(dto);

    expect(user.login).toBe(dto.login);
    expect(user.email).toBe(dto.email);
    expect(user.passwordHash).toBe(dto.passwordHash);

    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
    expect(user).toHaveProperty('deletedAt');

    expect(user).toHaveProperty('passwordRecovery');
    expect(user.passwordRecovery).toBeInstanceOf(PasswordRecovery);

    expect(user).toHaveProperty('emailConfirmation');
    expect(user.emailConfirmation).toBeInstanceOf(EmailConfirmation);

    TestLoggers.logUnit<UserDocument>(
      user,
      'Test №1: User Entity - createInstance()',
    );
  });

  it('should set the confirmation status to not "Confirmed" and cancel the confirmation code and expiration date using the "confirmByAdmin" method.', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      confirmationCode: 'test_confirmation-code',
      expirationDate: new Date(),
    };

    const user: UserDocument = User.createInstance(dto);

    expect(user.emailConfirmation.confirmationCode).toEqual(expect.any(String));
    expect(user.emailConfirmation.expirationDate).toBeInstanceOf(Date);
    expect(user.emailConfirmation.confirmationStatus).toBe(
      ConfirmationStatus.NotConfirmed,
    );

    user.confirmEmail();

    expect(user.emailConfirmation.confirmationCode).toBeNull();
    expect(user.emailConfirmation.expirationDate).toBeNull();
    expect(user.emailConfirmation.confirmationStatus).toBe(
      ConfirmationStatus.Confirmed,
    );

    TestLoggers.logUnit<UserDocument>(
      user,
      'Test №2: User Entity - confirmByAdmin()',
    );
  });

  it('should set deletedAt to the current date, if not already deleted using the "makeDeleted" method.', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      confirmationCode: 'test_confirmation-code',
      expirationDate: new Date(),
    };

    const user: UserDocument = User.createInstance(dto);

    user.deletedAt = null;

    user.delete();

    expect(user.deletedAt).toBeInstanceOf(Date);

    TestLoggers.logUnit<UserDocument>(
      user,
      'Test №3: User Entity - makeDeleted()',
    );
  });

  it('should throw an error if the user has already been marked as deleted.', () => {
    const dto: CreateUserDomainDto = {
      login: 'test_user',
      email: 'test_user@example.com',
      passwordHash: 'hashedPassword',
      confirmationCode: 'test_confirmation-code',
      expirationDate: new Date(),
    };

    const user: UserDocument = User.createInstance(dto);

    user.deletedAt = new Date();

    expect(() => user.delete()).toThrow('Entity already deleted');

    TestLoggers.logUnit<UserDocument>(
      user,
      'Test №4: User Entity - makeDeleted()',
    );
  });
});
