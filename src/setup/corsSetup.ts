import { INestApplication } from '@nestjs/common';

function corsSetup(app: INestApplication) {

  app.enableCors();
}

export {corsSetup};