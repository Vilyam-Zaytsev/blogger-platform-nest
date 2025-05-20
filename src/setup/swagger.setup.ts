import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GLOBAL_PREFIX } from './global-prefix.setup';

export function swaggerSetup(app: INestApplication, isSwaggerEnabled: boolean) {
  if (isSwaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('BLOGGER PLATFORM API')
      .addBearerAuth()
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(GLOBAL_PREFIX, app, document, {
      customSiteTitle: 'Blogger Swagger',
    });
  }
}
