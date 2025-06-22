import { ThrottlerStorage } from '@nestjs/throttler';

export type AdminCredentials = {
  login: string;
  password: string;
};

export type TestSearchFilter = {
  login?: string;
  email?: string;
  name?: string;
};

export type TestResultLogin = {
  loginOrEmail: string;
  authTokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export interface MemoryThrottlerStorageLike extends ThrottlerStorage {
  storage: Map<string, unknown>;
}
