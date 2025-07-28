import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { orders } from './entity/orders.entity';
import { OrdersItems } from './entity/orders-items.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from 'src/config';
import { PRODUCT_SERVICE } from 'src/config/service';

@Module({
  imports: [TypeOrmModule.forFeature([orders , OrdersItems]) , ClientsModule.register([
    {
      name: PRODUCT_SERVICE,
      transport: Transport.TCP,
      options: {
        host: envs.productMicroserviceHost,
        port: envs.productMicroservicePort,
      },
    },
  ])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
