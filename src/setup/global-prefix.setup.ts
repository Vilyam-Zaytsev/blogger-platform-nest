import { INestApplication } from '@nestjs/common';

export const GLOBAL_PREFIX: string = 'api';

function globalPrefixSetup(app: INestApplication) {
  app.setGlobalPrefix(GLOBAL_PREFIX);
}

export { globalPrefixSetup };
