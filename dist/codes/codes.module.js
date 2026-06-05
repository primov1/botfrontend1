"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const codes_service_1 = require("./codes.service");
const codes_controller_1 = require("./codes.controller");
const code_entity_1 = require("../common/entities/code.entity");
const product_entity_1 = require("../common/entities/product.entity");
const products_module_1 = require("../products/products.module");
let CodesModule = class CodesModule {
};
exports.CodesModule = CodesModule;
exports.CodesModule = CodesModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([code_entity_1.Code, product_entity_1.Product]), products_module_1.ProductsModule],
        controllers: [codes_controller_1.CodesController],
        providers: [codes_service_1.CodesService],
        exports: [codes_service_1.CodesService],
    })
], CodesModule);
//# sourceMappingURL=codes.module.js.map