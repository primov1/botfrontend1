import { UploadImageService } from './upload-image.service';
export declare class UploadController {
    private readonly images;
    constructor(images: UploadImageService);
    uploadImage(file: Express.Multer.File): Promise<{
        success: boolean;
        error: string;
        url?: undefined;
    } | {
        success: boolean;
        url: string;
        error?: undefined;
    }>;
}
