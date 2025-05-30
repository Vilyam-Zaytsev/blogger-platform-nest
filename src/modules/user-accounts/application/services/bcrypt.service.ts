import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  async generateHash(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt(10);

    return bcrypt.hash(password, salt);
  }

  async checkPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
