import type { Response } from 'express';
import { GiftsService } from './gifts.service';
export declare class GiftsController {
    private readonly giftsService;
    constructor(giftsService: GiftsService);
    list(q: string, page: string, limit: string, created: string, updated: string, deleted: string, res: Response): Promise<void>;
    newForm(res: Response): void;
    create(title: string, image: string, price: string, res: Response): Promise<void>;
    edit(id: number, res: Response): Promise<void>;
    update(id: number, title: string, image: string, price: string, res: Response): Promise<void>;
    remove(id: number, res: Response): Promise<void>;
    contactSettingsPage(saved: string, res: Response): Promise<void>;
    saveContactSettings(body: any, res: Response): Promise<void>;
}
