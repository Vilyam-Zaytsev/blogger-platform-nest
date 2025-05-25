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
