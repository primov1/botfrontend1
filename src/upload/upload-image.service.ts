import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UploadImageService {
    private readonly logger = new Logger(UploadImageService.name);

    async upload(buffer: Buffer): Promise<string | null> {
        const apiKey = process.env.IMGBB_API_KEY;
        if (!apiKey) {
            this.logger.warn('IMGBB_API_KEY muhit o\'zgaruvchisi o\'rnatilmagan');
            return null;
        }

        try {
            const body = new URLSearchParams();
            body.append('key', apiKey);
            body.append('image', buffer.toString('base64'));

            const res = await fetch('https://api.imgbb.com/1/upload', {
                method: 'POST',
                body,
                signal: AbortSignal.timeout(15_000),
            });
            const json = (await res.json()) as any;
            if (!json?.success) throw new Error('ImgBB rad etdi');
            return json.data.display_url as string;
        } catch (err) {
            this.logger.warn(`ImgBB yuklash muvaffaqiyatsiz: ${(err as Error).message}`);
            return null;
        }
    }
}
