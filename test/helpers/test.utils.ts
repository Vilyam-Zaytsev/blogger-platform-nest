export class TestUtils {
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }

    return result;
  }

  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static encodingAdminDataInBase64(login: string, password: string): string {
    const adminData: string = `${login}:${password}`;
    const adminDataBase64: string = Buffer.from(adminData).toString('base64');

    return `Basic ${adminDataBase64}`;
  }
}
