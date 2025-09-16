
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
// import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';
import { BullModule } from '@nestjs/bullmq';
// import { ProductModule } from './infrastructure/http/modules/product.module';
// import { Product } from './domain/entities/product.entity';

@Module({
  imports: [
    // Configures environment variables and validates them using Joi schema
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_PORT: Joi.number().default(28325),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(16905),
        REDIS_USER: Joi.string().required(),
        REDIS_PASSWORD: Joi.string().required(),
      })
    }),

    // Configures assincronous database connection of mySQL type and loads variables from .env file 
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        // entities: [Product],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    // Configures API request throttling to limit the number of requests a client can make in a given time period
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 100
        }
      ]
    }),
    // browsing / product endpoints: limit = 120, ttl = 60
    // product list/images served by CDN?
    // Search endpoints: limit = 60, ttl = 60 (or 120/60 if search is cheap)
    // Checkout / payment endpoints: limit = 10, ttl = 60
    // Admin / management APIs: limit = 30, ttl = 60
    // (HTTP 429 + Retry-After header and a JSON body explaining limit and reset time). OWASP recommends notifying clients when the limit is exceeded)
    // X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset so front-ends (or mobile apps) can gracefully degrade
    // push static and heavy read requests to CDN;

    // Configures logging using Pino (advanced logging) with pretty-printing for better readability during development
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty'
        }
      }
    }),
    // export class MyService {
    //   constructor(private readonly logger: Logger) {}
    //   doStuff() {
    //     this.logger.info({ foo: 'bar' }, 'Something happened');
    //   }
    // }

    // Configures caching with Redis

    // Configures BullMQ for background job processing with Redis as the message broker
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT) || 6379,
        username: process.env.REDIS_USER,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    // BullModule.registerQueue({
    //   name: 'emailQueue',
    // }),
    // ProductModule,
  ],
  // providers: [emailProcessor],
})

export class AppModule {
// export class AppModule implements NestModule {

  // configure(consumer: MiddlewareConsumer) {
    
  //   consumer.apply(LoggerMiddleware).forRoutes('*');
  // }


}
