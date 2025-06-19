export interface ICookieRequest extends Request {
  cookies: {
    refreshToken?: string;
  };
}
