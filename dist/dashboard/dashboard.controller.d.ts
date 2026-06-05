import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { GiftsService } from '../gifts/gifts.service';
import { ConfirmationsService } from '../confirmations/confirmations.service';
export declare class DashboardController {
    private readonly usersService;
    private readonly productsService;
    private readonly giftsService;
    private readonly confirmationsService;
    constructor(usersService: UsersService, productsService: ProductsService, giftsService: GiftsService, confirmationsService: ConfirmationsService);
    index(res: Response): Promise<void>;
}
