import { Global, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadImageService } from './upload-image.service';

@Global()
@Module({
    controllers: [UploadController],
    providers: [UploadImageService],
    exports: [UploadImageService],
})
export class UploadModule {}
