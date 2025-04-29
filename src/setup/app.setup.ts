import { INestApplication } from '@nestjs/common';
import { corsSetup } from './corsSetup';
import { globalPrefixSetup } from './global-prefix.setup';
import { pipesSetup } from './pipes.setup';

export function appSetup(app: INestApplication) {
  corsSetup(app);
  pipesSetup(app);
  globalPrefixSetup(app);
}
