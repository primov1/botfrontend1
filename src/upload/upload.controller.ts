import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) return { success: false, error: 'Fayl yuklanmadi' };
        try {
            const optimized = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85 })
                .toBuffer();

            const url = await this.images.upload(optimized);
            if (!url) return { success: false, error: 'IMGBB_API_KEY sozlanmagan' };
            return { success: true, url };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    }
}
