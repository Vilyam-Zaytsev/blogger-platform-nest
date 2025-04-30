import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('testing')
export class TestingController {
  constructor(
    @InjectConnection() private readonly databaseConnection: Connection,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const collections = await this.databaseConnection.listCollections();

    const promises = collections.map((collection) =>
      this.databaseConnection.collection(collection.name).deleteMany({}),
    );
    await Promise.all(promises);

    return {
      status: 'succeeded',
    };
  }
}
