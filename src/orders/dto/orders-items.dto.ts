import { IsNumber, IsPositive, IsString } from 'class-validator';

export class OrdersItemsDto {

    @IsString()
    productId: string;

    @IsNumber()
    @IsPositive()
    quantity : number;

    @IsNumber()
    @IsPositive()
    price : number;






}