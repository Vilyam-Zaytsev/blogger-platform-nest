import { INestApplication } from '@nestjs/common';
import { corsSetup } from './corsSetup';
import { pipesSetup } from './pipes.setup';
// TODO: Разобраться, зачем мы устанавливаем globalPrefix, если из-за него не проходят тесты/домашнее задание.
export function appSetup(app: INestApplication) {
  corsSetup(app);
  pipesSetup(app);
  // globalPrefixSetup(app);
}
