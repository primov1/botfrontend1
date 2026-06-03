import { Global, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImagesController } from './images.controller';
import { UploadImageService } from './upload-image.service';

@Global()
@Module({
    controllers: [UploadController, ImagesController],
    providers: [UploadImageService],
    exports: [UploadImageService],
})
export class UploadModule {}
