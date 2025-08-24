import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { orders } from './entity/orders.entity';
import { OrdersItems } from './entity/orders-items.entity';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  imports: [TypeOrmModule.forFeature([orders , OrdersItems]) , 
  NatsModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
