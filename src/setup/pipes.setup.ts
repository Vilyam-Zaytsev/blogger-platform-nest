import { INestApplication, ValidationPipe } from '@nestjs/common';

function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
    }),
  );
}

export { pipesSetup };
