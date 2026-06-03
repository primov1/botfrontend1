import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftOrdersController } from './gift-orders.controller';
import { GiftOrdersService } from './gift-orders.service';
import { GiftPurchase } from '../common/entities/gift-purchase.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([GiftPurchase])],
    controllers: [GiftOrdersController],
    providers: [GiftOrdersService],
    exports: [GiftOrdersService],
})
export class GiftOrdersModule {}
