import { INestApplication } from '@nestjs/common';

function globalPrefixSetup(app: INestApplication) {

  app.setGlobalPrefix('api');
}

export {globalPrefixSetup};