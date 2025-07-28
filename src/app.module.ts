import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config';

@Module({
  imports: [OrdersModule , TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.dbHost,
      port: envs.dbPort,
      username: envs.dbUser,
      password: envs.dbPass,
      database: envs.dbName,
      autoLoadEntities: true,
      synchronize: true,
    }), ],
  controllers: [],
  providers: [],
})
export class AppModule {}
