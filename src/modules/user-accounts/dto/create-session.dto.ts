export class CreateSessionDto {
  userId: string;
  deviceId: string;
  userAgent: string;
  ip: string;
  iat: number;
  exp: number;
}
