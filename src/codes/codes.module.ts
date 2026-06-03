import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodesService } from './codes.service';
import { CodesController } from './codes.controller';
import { Code } from '../common/entities/code.entity';
import { Product } from '../common/entities/product.entity';
import { ProductsModule } from '../products/products.module';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Code, Product]), ProductsModule],
    controllers: [CodesController],
    providers: [CodesService],
    exports: [CodesService],
})
export class CodesModule {}
