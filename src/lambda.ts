import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { setupView } from './common/view.setup';

// Cold-start'da bir nechta so'rov kelganda app faqat BIR marta yaratilishi uchun
// natijani emas, PROMISE'ni cache qilamiz (race condition'ning oldini oladi).
let appPromise: Promise<(req: any, res: any) => void> | undefined;

async function createHandler(): Promise<(req: any, res: any) => void> {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const root = join(__dirname, '..');
    setupView(app, root);

    await app.init();
    return app.getHttpAdapter().getInstance();
}

export default async (req: any, res: any) => {
    if (!appPromise) appPromise = createHandler();
    const instance = await appPromise;
    instance(req, res);
};
