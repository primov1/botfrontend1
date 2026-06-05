import type { Response } from 'express';
import { ProductsService } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    list(q: string, page: string, limit: string, created: string, updated: string, deleted: string, res: Response): Promise<void>;
    newForm(res: Response): void;
    create(title: string, image: string, uzum_url: string, bonus: string, telegramChannel: string, instagram: string, requireChannel: string, res: Response): Promise<void>;
    edit(id: number, res: Response): Promise<void>;
    update(id: number, title: string, image: string, uzum_url: string, bonus: string, telegramChannel: string, instagram: string, requireChannel: string, res: Response): Promise<void>;
    remove(id: number, res: Response): Promise<void>;
}
