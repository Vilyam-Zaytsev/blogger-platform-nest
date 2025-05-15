import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  async createPasswordHash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);

    return bcrypt.hash(password, salt);
  }

  comparePassword({
    password,
    hash,
  }: {
    password: string;
    hash: string;
  }): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
