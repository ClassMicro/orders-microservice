import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { orders } from './entity/orders.entity';
import { OrdersItems } from './entity/orders-items.entity';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrdersPaginationDto } from './dto/ordersd-pagination.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ChangeOrderStatusDto } from './dto/change-ordres.dto';
import { OrderStatus } from './enum/status';
import { PRODUCT_SERVICE } from 'src/config/service';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';
import { any } from 'joi';
import { totalmem } from 'os';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productServiceClient: ClientProxy,
    @InjectRepository(orders)
    private readonly ordersRepository: Repository<orders>,
    @InjectRepository(OrdersItems)
    private readonly ordersItemsRepository: Repository<OrdersItems>,
  ) {}

  async onModuleInit() {
    try {
      await this.productServiceClient.connect();
      this.logger.log('Conexión establecida con el servicio de productos');
    } catch (error) {
      this.logger.error(
        'Perdida de conexión con el servicio de productos:',
        error,
      );
    }
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      //1. Validar que los productos existen
      const productIds = createOrderDto.items.map((item) => item.productId);
      this.logger.log(`Validando productos con IDs: ${productIds}`);
      const products: any[] = await firstValueFrom(
        this.productServiceClient.send({ cmd: 'validateproduct' }, productIds),
      );
      //2. calcuar el total de la orden
      const totalAmount = createOrderDto.items.reduce((acc, ordersitems) => {
        const product = products.find((p) => p.id === ordersitems.productId);
        if (product) {
          return acc + product.price * ordersitems.quantity;
        }
        const price = products.find(
          (product) => product.id === ordersitems.productId,
        ).price;
        return acc + price * ordersitems.quantity;
      }, 0);

      // Calcular el total de items
      const totalItems = createOrderDto.items.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );

      //3. Crear la orden o una transaccion de bases de datos
      const orderItems = createOrderDto.items.map((item) => {
        const product = products.find(
          (product) => product.id === item.productId,
        );
        return this.ordersItemsRepository.create({
          quantity: item.quantity,
          productId: item.productId,
          price: product ? product.price : 0,
        });
      });
      const order = this.ordersRepository.create({
        total: totalAmount,
        totalItems: totalItems,
        OrdersItems: createOrderDto.items.map((OrdersItems) => ({
          price: products.find((product) => product.id === OrdersItems.productId).price,
          productId: OrdersItems.productId,
          quantity: OrdersItems.quantity,
        })),

      });
      // Save order and its items in a transaction
      const savedOrder = await this.ordersRepository.save(order);
      await this.ordersItemsRepository.save(orderItems);
      
      return {
        message: 'Orden creada correctamente',
        orders: {
          ...savedOrder,
          OrdersItems: savedOrder.OrdersItems.map((orderItem) => {
            const product = products.find(p => p.id === orderItem.productId);
            return {
              ...orderItem,
              productName: product.name 
            };
          })
        },
      };
    } catch (error) {
      this.logger.error('Error al validar productos:', error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Error al validar productos',
      });
    }
  }

  async findAll(ordersPaginationDto: OrdersPaginationDto) {
    const totalpages = await this.ordersRepository.count({
      where: {
        status: ordersPaginationDto.status,
      },
    });
    const currentpage = ordersPaginationDto.page || 1;
    const perpage = ordersPaginationDto.limit || 10;

    const orders = await this.ordersRepository.find();
    if (orders.length === 0) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'No se encontraron órdenes',
      });
    }
    return {
      message: 'ordenes encontradas',
      data: await this.ordersRepository.find({
        skip: (currentpage - 1) * perpage,
        take: perpage,
        where: {
          status: ordersPaginationDto.status,
        },
      }),
      meta: {
        total: totalpages,
        pages: currentpage,
        lastpage: Math.ceil(totalpages / perpage),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Orden con ID ${id} no encontrada`,
      });
    }
    return {
      message: 'Orden encontrada',
      order: order,
    };
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
          message: `Orden con ID ${id} no encontrada`,
        });
      }
      if (order.status === status) {
        return {
          message: 'El estado de la orden es la misma',
          order: order,
        };
      }

      // Actualizar el estado y guardar (esto retorna la entidad actualizada)
      order.status = status;
      const updatedOrder = await this.ordersRepository.save(order);

      return {
        message: 'Estado de la orden actualizado correctamente',
        order: updatedOrder,
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error al cambiar el estado de la orden: ${error.message}`,
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
