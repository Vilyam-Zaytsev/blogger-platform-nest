import { INestApplication } from '@nestjs/common';
import { corsSetup } from './cors.setup';
import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';

export function appSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  corsSetup(app);
  pipesSetup(app);
  globalPrefixSetup(app);
  swaggerSetup(app, isSwaggerEnabled);
}
