import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { orders } from './entity/orders.entity';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrdersPaginationDto } from './dto/ordersd-pagination.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ChangeOrderStatusDto } from './dto/change-ordres.dto';
import * as request from 'supertest';
import { PRODUCT_SERVICE } from 'src/config/service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productServiceClient: ClientProxy,
    @InjectRepository(orders) private readonly ordersRepository: Repository<orders>) {}
  async create(createOrderDto: CreateOrderDto) {
    try {
      // aqui llegamos a nuestro microservico de productos con la validacion de los de cmd
      const products = await this.productServiceClient.send(
        { cmd: 'validate-product' },
        createOrderDto.items.map(item => item.productId)
      )
      return products
    } catch (error) {
       throw new RpcException({
         message: `Error al crear la orden: ${error.message}`,
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }
   

   async findAll(ordersPaginationDto: OrdersPaginationDto) {

    const totalpages = await this.ordersRepository.count({
      where :{
        status : ordersPaginationDto.status
      }
    });
    const currentpage = ordersPaginationDto.page || 1;
    const perpage = ordersPaginationDto.limit || 10;


    const orders = await this.ordersRepository.find();
    if (orders.length === 0) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'No se encontraron órdenes'});
    }
    return {
      message :'ordenes encontradas',
      data : await this.ordersRepository.find({
        skip : (currentpage -1) * perpage,
        take : perpage,
        where :{
          status : ordersPaginationDto.status
        }
      }),
      meta : {
        total : totalpages,
        pages : currentpage,
        lastpage : Math.ceil(totalpages/ perpage)
      }

    }
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new RpcException({
       status: HttpStatus.NOT_FOUND,
        message: `Orden con ID ${id} no encontrada`});
    }
    return {
      message: 'Orden encontrada',
      order: order
    }
  }
  

     // ...existing code...
  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    try {
      const { id, status } = changeOrderStatusDto;
      
      // Buscar la orden existente
      const order = await this.ordersRepository.findOne({ where: { id } });
      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Orden con ID ${id} no encontrada`
        });
      }
      if(order.status === status){
        return{
          message: 'El estado de la orden es la misma',
          order: order
        }
      }
  
      // Actualizar el estado y guardar (esto retorna la entidad actualizada)
      order.status = status;
      const updatedOrder = await this.ordersRepository.save(order);
      
      return {
        message: 'Estado de la orden actualizado correctamente',
        order: updatedOrder
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error al cambiar el estado de la orden: ${error.message}`
      });
    }
  }
  // ...existing code...

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
