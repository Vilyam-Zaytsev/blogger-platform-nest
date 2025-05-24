import { NestFactory } from '@nestjs/core';
import { appSetup } from './setup/app.setup';
import { CoreConfig } from './core/core.config';
import { initAppModule } from './init-app-module';

async function bootstrap() {
  const DynamicAppModule = await initAppModule();

  const app = await NestFactory.create(DynamicAppModule);

  const coreConfig: CoreConfig = app.get<CoreConfig>(CoreConfig);

  appSetup(app, coreConfig.isSwaggerEnabled);

  const PORT: number = coreConfig.port;

  await app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap();

//  "jest": {
//    "moduleFileExtensions": [
//      "js",
//      "json",
//      "ts"
//    ],
//    "rootDir": "src",
//    "testRegex": ".*\\.spec\\.ts$",
//    "transform": {
//      "^.+\\.(t|j)s$": "ts-jest"
//    },
//    "collectCoverageFrom": [
//      "**/*.(t|j)s"
//    ],
//    "coverageDirectory": "../coverage",
//    "testEnvironment": "node"
//  }
