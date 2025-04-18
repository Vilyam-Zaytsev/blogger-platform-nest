import { INestApplication } from '@nestjs/common';
import { corsSetup } from './corsSetup';
import { globalPrefixSetup } from './globalPrefixSetup';

function appSetup(app: INestApplication) {

  corsSetup(app);
  globalPrefixSetup(app);
}

export {appSetup};