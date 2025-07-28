import { OrderStatus } from "../enum/status";
import { OrdersStatusList } from "../enum/orders.enum";
import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "src/common/dto/pagination";

export class OrdersPaginationDto extends PaginationDto {

@IsOptional()
@IsEnum(OrdersStatusList,{
    message : `el estado debe ser uno de los siguientes : ${OrdersStatusList}`
})
    status: OrderStatus;
}