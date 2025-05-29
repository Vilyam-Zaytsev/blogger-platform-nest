import { CreateUserDto } from '../dto/create-user.dto';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDomainDto } from '../domain/dto/create-user.domain.dto';
import { add } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { CryptoService } from './services/crypto.service';
//TODO: правильно ли, что я в фабрике создаю инстанс модели?
@Injectable()
export class UsersFactory {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
    private readonly cryptoService: CryptoService,
  ) {}
  async create(dto: CreateUserDto): Promise<UserDocument> {
    const { email, login, password } = dto;

    const passwordHash: string =
      await this.cryptoService.createPasswordHash(password);

    const confirmationCode: string = this.cryptoService.generateUUID();

    const expirationDate: Date = add(new Date(), { hours: 1, minutes: 1 });

    const user: CreateUserDomainDto = {
      email,
      login,
      passwordHash,
      confirmationCode,
      expirationDate,
    };

    return this.UserModel.createInstance(user);
  }
}
