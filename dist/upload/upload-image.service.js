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
var UploadImageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadImageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const node_crypto_1 = require("node:crypto");
let UploadImageService = UploadImageService_1 = class UploadImageService {
    dataSource;
    logger = new common_1.Logger(UploadImageService_1.name);
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        try {
            await this.dataSource.query(`CREATE TABLE IF NOT EXISTS "uploaded_images" (
                    "id" varchar PRIMARY KEY,
                    "data" bytea NOT NULL,
                    "mime" varchar NOT NULL DEFAULT 'image/jpeg',
                    "createdAt" timestamptz NOT NULL DEFAULT now()
                )`);
        }
        catch (err) {
            this.logger.warn(`uploaded_images jadvalini yaratib bo'lmadi: ${err.message}`);
        }
    }
    async save(buffer, mime = 'image/jpeg') {
        const id = (0, node_crypto_1.randomBytes)(10).toString('hex');
        await this.dataSource.query(`INSERT INTO "uploaded_images" ("id", "data", "mime") VALUES ($1, $2, $3)`, [id, buffer, mime]);
        return id;
    }
    async get(id) {
        const rows = await this.dataSource.query(`SELECT "data", "mime" FROM "uploaded_images" WHERE "id" = $1`, [id]);
        if (!rows[0])
            return null;
        return { data: rows[0].data, mime: rows[0].mime };
    }
    buildUrl(req, id) {
        const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.get('host');
        return `${proto}://${host}/i/${id}`;
    }
};
exports.UploadImageService = UploadImageService;
exports.UploadImageService = UploadImageService = UploadImageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], UploadImageService);
//# sourceMappingURL=upload-image.service.js.map