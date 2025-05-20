import { DynamicModule } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CoreConfig } from './core/core.config';
//TODO: зачем эта функция
export async function initAppModule(): Promise<DynamicModule> {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const coreConfig = appContext.get<CoreConfig>(CoreConfig);
  await appContext.close();

  return AppModule.forRoot(coreConfig);
}
