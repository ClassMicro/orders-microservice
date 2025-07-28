import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersPaginationDto } from './dto/ordersd-pagination.dto';
import { ChangeOrderStatusDto } from './dto/change-ordres.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() ordersPaginationDto: OrdersPaginationDto) {
    return this.ordersService.findAll(ordersPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('changeOrdersStatus')
  changeStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto) {
    return this.ordersService.changeStatus(changeOrderStatusDto);
  }

  // @MessagePattern('updateOrder')
  // update(@Payload() updateOrderDto: UpdateOrderDto) {
  //   return this.ordersService.update(updateOrderDto.id, updateOrderDto);
  // }

  // @MessagePattern('removeOrder')
  // remove(@Payload() id: number) {
  //   return this.ordersService.remove(id);
  // }
}
