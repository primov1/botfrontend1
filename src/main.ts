import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { setupView } from './common/view.setup';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // dist/main.js joylashuvi asosida root papkani topamiz
    const root = join(__dirname, '..');
    setupView(app, root);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Dashboard ishga tushdi: http://localhost:${port}`);
}
bootstrap();
