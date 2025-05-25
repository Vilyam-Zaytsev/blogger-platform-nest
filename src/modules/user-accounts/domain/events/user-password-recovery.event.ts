export class UserPasswordRecoveryEvent {
  constructor(
    public readonly email: string,
    public readonly recoveryCode: string,
  ) {}
}
