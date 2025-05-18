import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSetup(app);

  console.log(process.env.PORT);
  const PORT = process.env.PORT ?? 3000;

  await app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap();
