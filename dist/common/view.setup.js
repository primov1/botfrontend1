"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupView = setupView;
const node_path_1 = require("node:path");
const hbs_1 = __importDefault(require("hbs"));
const i18n_1 = require("./i18n");
function setupView(app, root) {
    app.useStaticAssets((0, node_path_1.join)(root, 'public'));
    app.setBaseViewsDir((0, node_path_1.join)(root, 'views'));
    app.setViewEngine('hbs');
    app.set('view options', { layout: 'layouts/main' });
    hbs_1.default.registerPartials((0, node_path_1.join)(root, 'views', 'partials'));
    hbs_1.default.registerHelper('eq', (a, b) => a === b);
    hbs_1.default.registerHelper('ne', (a, b) => a !== b);
    hbs_1.default.registerHelper('gt', (a, b) => Number(a) > Number(b));
    hbs_1.default.registerHelper('json', (ctx) => JSON.stringify(ctx));
    hbs_1.default.registerHelper('formatPrice', (value) => {
        if (typeof value !== 'number')
            return value;
        return new Intl.NumberFormat('uz-UZ').format(value);
    });
    hbs_1.default.registerHelper('formatDate', (value) => {
        if (!value)
            return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime()))
            return '-';
        return d.toLocaleString('uz-UZ', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit',
            timeZone: 'Asia/Tashkent',
        });
    });
    hbs_1.default.registerHelper('inc', (value) => Number(value) + 1);
    hbs_1.default.registerHelper('dec', (value) => Number(value) - 1);
    hbs_1.default.registerHelper('t', function (key, options) {
        const lang = (0, i18n_1.normalizeLang)(options?.data?.root?.lang);
        return (0, i18n_1.tr)(lang, key);
    });
}
//# sourceMappingURL=view.setup.js.map