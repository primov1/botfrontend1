"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const node_path_1 = require("node:path");
const app_module_1 = require("./app.module");
const view_setup_1 = require("./common/view.setup");
let appPromise;
async function createHandler() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const root = (0, node_path_1.join)(__dirname, '..');
    (0, view_setup_1.setupView)(app, root);
    await app.init();
    return app.getHttpAdapter().getInstance();
}
exports.default = async (req, res) => {
    if (!appPromise)
        appPromise = createHandler();
    const instance = await appPromise;
    instance(req, res);
};
//# sourceMappingURL=lambda.js.map