"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
require("reflect-metadata");
if (!global.crypto) {
    global.crypto = require('crypto');
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL || 'http://localhost:3000'
        ],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 BFF GraphQL server running on http://localhost:${port}/graphql`);
}
bootstrap().catch((error) => {
    console.error('Error starting BFF server:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map