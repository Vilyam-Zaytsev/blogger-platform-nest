import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

function cookieSetup(app: INestApplication) {
  app.use(cookieParser());
}

export { cookieSetup };
