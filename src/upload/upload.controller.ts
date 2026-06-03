import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { AdminAuthGuard } from '../common/auth.guard';
import { UploadImageService } from './upload-image.service';
import sharp from 'sharp';

@Controller('api')
@UseGuards(AdminAuthGuard)
export class UploadController {
    constructor(private readonly images: UploadImageService) {}

    @Post('upload-image')
    @UseInterceptors(FileInterceptor('image', {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
        },
    }))
    async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
        if (!file) return { success: false, error: 'Fayl yuklanmadi' };
        try {
            const optimized = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();

            // Tashqi xizmatsiz — to'g'ridan bazaga saqlaymiz
            const id = await this.images.save(optimized, 'image/jpeg');
            return { success: true, url: this.images.buildUrl(req, id) };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }
}
