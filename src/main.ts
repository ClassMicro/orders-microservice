import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('orders-main')
  logger.log(`Microservicio de órdenes iniciado en ${envs.nastServer}`);
  // implementamos los microservicios de ordenes para conectar con nuestro gateway por tcp en el transport
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule ,{
    transport: Transport.NATS,
    options: {
      // port: envs.port,
      servers: envs.nastServer,
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // app.setGlobalPrefix('api')
  // app.enableCors({
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });
  await app.listen();
  logger.log( `aplicacion microservicios de ordenes corriendo en el puerto: ${envs.port}`);
}
bootstrap();
