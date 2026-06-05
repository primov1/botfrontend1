"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesController = void 0;
const common_1 = require("@nestjs/common");
const upload_image_service_1 = require("./upload-image.service");
let ImagesController = class ImagesController {
    images;
    constructor(images) {
        this.images = images;
    }
    async serve(id, res) {
        const img = await this.images.get(id);
        if (!img) {
            res.status(404).send('Rasm topilmadi');
            return;
        }
        res.set('Content-Type', img.mime);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(img.data);
    }
};
exports.ImagesController = ImagesController;
__decorate([
    (0, common_1.Get)('i/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "serve", null);
exports.ImagesController = ImagesController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [upload_image_service_1.UploadImageService])
], ImagesController);
//# sourceMappingURL=images.controller.js.map