export class CreateUserDomainDto {
  login: string;
  email: string;
  passwordHash: string;
  isConfirmed: boolean;
}
