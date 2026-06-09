"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UploadImageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadImageService = void 0;
const common_1 = require("@nestjs/common");
let UploadImageService = UploadImageService_1 = class UploadImageService {
    logger = new common_1.Logger(UploadImageService_1.name);
    async upload(buffer) {
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
            const json = (await res.json());
            if (!json?.success)
                throw new Error('ImgBB rad etdi');
            return json.data.display_url;
        }
        catch (err) {
            this.logger.warn(`ImgBB yuklash muvaffaqiyatsiz: ${err.message}`);
            return null;
        }
    }
};
exports.UploadImageService = UploadImageService;
exports.UploadImageService = UploadImageService = UploadImageService_1 = __decorate([
    (0, common_1.Injectable)()
], UploadImageService);
//# sourceMappingURL=upload-image.service.js.map