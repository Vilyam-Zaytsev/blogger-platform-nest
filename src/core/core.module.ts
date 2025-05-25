import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config';

@Global()
@Module({
  imports: [CqrsModule],
  providers: [CoreConfig],
  exports: [CoreConfig, CqrsModule],
})
export class CoreModule {}
