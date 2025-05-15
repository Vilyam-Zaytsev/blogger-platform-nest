import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

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

  generateUUID(): string {
    return randomUUID();
  }
}
