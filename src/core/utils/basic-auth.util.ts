/**
 * Parses a Basic Authorization header and extracts the username and password.
 *
 * This function expects the header to be in the format: "Basic base64(username:password)".
 * It validates the format, decodes the base64 string, and splits it into the username and password.
 *
 * @param {string} authHeader - The value of the "Authorization" HTTP header.
 * @returns {[string, string]} A tuple containing the username and password.
 *
 * @throws {Error} If the header is missing, malformed, not base64 encoded, or doesn't follow the expected format.
 */
export function parseBasicAuth(authHeader?: string): [string, string] {
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    throw new Error('Invalid Basic Authorization header format.');
  }

  const base64Credentials: string = authHeader.split(' ')[1];

  let decoded: string;

  try {
    decoded = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  } catch {
    throw new Error('Failed to decode Basic Auth credentials.');
  }

  const [username, password] = decoded.split(':');

  if (!username || !password) {
    throw new Error('Invalid Basic Auth credentials format.');
  }

  return [username, password];
}
