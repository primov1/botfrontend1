"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationsModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const confirmations_controller_1 = require("./confirmations.controller");
const confirmations_service_1 = require("./confirmations.service");
const pending_count_interceptor_1 = require("./pending-count.interceptor");
const purchase_entity_1 = require("../common/entities/purchase.entity");
const user_entity_1 = require("../common/entities/user.entity");
const product_entity_1 = require("../common/entities/product.entity");
const code_entity_1 = require("../common/entities/code.entity");
let ConfirmationsModule = class ConfirmationsModule {
};
exports.ConfirmationsModule = ConfirmationsModule;
exports.ConfirmationsModule = ConfirmationsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([purchase_entity_1.Purchase, user_entity_1.User, product_entity_1.Product, code_entity_1.Code])],
        controllers: [confirmations_controller_1.ConfirmationsController],
        providers: [
            confirmations_service_1.ConfirmationsService,
            { provide: core_1.APP_INTERCEPTOR, useClass: pending_count_interceptor_1.PendingCountInterceptor },
        ],
        exports: [confirmations_service_1.ConfirmationsService],
    })
], ConfirmationsModule);
//# sourceMappingURL=confirmations.module.js.map