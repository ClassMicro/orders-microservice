import { ArrayMinSize, arrayMinSize, IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, ValidateNested } from "class-validator";
import { OrderStatus } from "../enum/status";
import { OrdersStatusList } from "../enum/orders.enum";
import { any } from "joi";
import { OrdersItemsDto } from "./orders-items.dto";
import { Type } from "class-transformer";

export class CreateOrderDto {


    // @IsNumber()
    // @IsPositive()
    // total : number;

    // @IsNumber() 
    // @IsPositive()
    // totalItems: number;

    // @IsEnum(OrdersStatusList,{
    //     message: `Status must be one of the following: ${OrdersStatusList}}`
    // })
    // @IsOptional()
    // status : OrderStatus = OrderStatus.PENDING

    // @IsBoolean()
    // @IsOptional()
    // paid : boolean = false;

    // esto es una evolucion del proyecto

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each: true})
    @Type(() => OrdersItemsDto)
    items : OrdersItemsDto[]
}
