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
import { NAST_SERVICE } from 'src/config/service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject( NAST_SERVICE) private readonly clients: ClientProxy,
    @InjectRepository(orders)
    private readonly ordersRepository: Repository<orders>,
    @InjectRepository(OrdersItems)
    private readonly ordersItemsRepository: Repository<OrdersItems>,
  ) {}

  async onModuleInit() {
    try {
      await this.clients.connect();
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
      const products: any[] = await firstValueFrom(
        this.clients.send({ cmd: 'validateproduct' }, productIds),
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

      //3. Crear la orden primero
      const order = this.ordersRepository.create({
        total: totalAmount,
        totalItems: totalItems,
      });

      // Guardar la orden para obtener el ID
      const savedOrder = await this.ordersRepository.save(order);

      // Crear los items con la referencia a la orden guardada
      const orderItems = createOrderDto.items.map((item) => {
        const product = products.find((product) => product.id === item.productId);
        return this.ordersItemsRepository.create({
          quantity: item.quantity,
          productId: item.productId,
          price: product ? product.price : 0,
          orders: savedOrder, // Establecer la relación con la orden
        });
      });

      // Guardar los items
      const savedItems = await this.ordersItemsRepository.save(orderItems);
      
      return {
        message: 'Orden creada correctamente',
        orders: {
          ...savedOrder,
          OrdersItems: savedItems.map((orderItem) => {
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
    try {
      const order = await this.ordersRepository.findOne({
        where: { id },
        relations: ['OrdersItems'],
        select: {
          id: true,
          total: true,
          status: true,
          totalItems: true,
          paid: true,
          paidAt: true,
          createdAt: true,
          updatedAt: true,
          OrdersItems: {
            id: true,
            quantity: true,
            productId: true,
            price: true,
          }
        }
      });
      
      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Orden con ID ${id} no encontrada`,
        });
      }

      // Verificar si la orden tiene items
      if (!order.OrdersItems || order.OrdersItems.length === 0) {
        // Buscar items directamente usando el orderId
        const orderItems = await this.ordersItemsRepository
          .createQueryBuilder('orderItem')
          .where('orderItem.orderId = :orderId', { orderId: id })
          .getMany();
          
        if (orderItems.length === 0) {
          return {
            message: 'Orden encontrada sin items',
            order: {
              ...order,
              OrdersItems: []
            }
          };
        }
        
        order.OrdersItems = orderItems;
      }

      const productIds = order.OrdersItems.map((item) => item.productId);
      // this.logger.log(`Validando productos con IDs: ${productIds}`);
      const products: any[] = await firstValueFrom(
        this.clients.send({ cmd: 'validateproduct' }, productIds),
      );
      
      return {
        message: 'Orden encontrada',
        order: {
          ...order,
          OrdersItems: order.OrdersItems.map((ordersitems) => {
            const product = products.find((product) => product.id === ordersitems.productId);
            return {
              ...ordersitems,
              name: product ? product.name : 'Producto no encontrado'
            };
          })
        }
      };
    } catch (error) {
      this.logger.error(`Error al buscar la orden con ID ${id}:`, error);
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Orden con ID ${id} no encontrada`,
      });
    }
  }
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
