import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';
import * as morgan from 'morgan';
import { AppModule } from './app.module';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.use(helmet()); // Helmet helps secure your app by setting various HTTP headers
  app.use(compression()); // Compression middleware to reduce the size of the response body and improve the speed of web applications
  app.use(morgan('combined')); // morgan logging for HTTP requests using 'combined' format for detailed logs
  
  // Enabling CORS for only the front-end origin and specific HTTP methods
  app.enableCors({
    // origin: '5000',
    // methods: 'GET,HEAD,PUT,POST,DELETE',
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
