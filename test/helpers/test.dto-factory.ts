import { UserInputDto } from '../../src/modules/user-accounts/api/input-dto/user.input-dto';

export class TestDtoFactory {
  static generateUserInputDto(quantity: number): UserInputDto[] {
    const users: UserInputDto[] = [];

    for (let i = 0; i < quantity; i++) {
      users.push({
        login: `testUser_${i}`,
        email: `testUser_${i}@example.com`,
        password: 'qwerty',
      });
    }

    return users;
  }
}
