import type { Response } from 'express';
import { CodesService } from './codes.service';
import { ProductsService } from '../products/products.service';
export declare class CodesController {
    private readonly codesService;
    private readonly productsService;
    constructor(codesService: CodesService, productsService: ProductsService);
    page(generated: string, error: string, res: Response): Promise<void>;
    saveStickerText(text: string, res: Response): Promise<void>;
    generate(productId: string, count: string, res: Response): Promise<void>;
    export(productId: number, res: Response): Promise<void>;
    removeForm(id: number, back: string, res: Response): Promise<void>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}
