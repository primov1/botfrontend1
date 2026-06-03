import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UploadImageService } from './upload-image.service';

/**
 * Saqlangan rasmlarni ko'rsatadi — PUBLIC (auth yo'q), shunda
 * <img src> ham, Telegram bot ham yuklab oladi.
 */
@Controller()
export class ImagesController {
    constructor(private readonly images: UploadImageService) {}

    @Get('i/:id')
    async serve(@Param('id') id: string, @Res() res: Response) {
        const img = await this.images.get(id);
        if (!img) {
            res.status(404).send('Rasm topilmadi');
            return;
        }
        res.set('Content-Type', img.mime);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(img.data);
    }
}
