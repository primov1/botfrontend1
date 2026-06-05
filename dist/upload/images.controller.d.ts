import type { Response } from 'express';
import { UploadImageService } from './upload-image.service';
export declare class ImagesController {
    private readonly images;
    constructor(images: UploadImageService);
    serve(id: string, res: Response): Promise<void>;
}
