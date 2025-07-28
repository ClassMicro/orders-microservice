import { IsEnum, IsUUID } from "class-validator";
import { OrdersStatusList } from "../enum/orders.enum";
import { OrderStatus } from "../enum/status";

export class ChangeOrderStatusDto {

    @IsUUID()
    id: string;

    @IsEnum(OrdersStatusList ,{
        message : ` El estado debe ser uno de los siguientes: ${OrdersStatusList}`
    })
    status: OrderStatus;
}
