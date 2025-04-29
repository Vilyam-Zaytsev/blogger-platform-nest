import { INestApplication, ValidationPipe } from '@nestjs/common';

function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
}

export { pipesSetup };
