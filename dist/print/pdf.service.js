"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const QRCode = __importStar(require("qrcode"));
const MM = 2.83465;
const mm = (n) => n * MM;
let PdfService = class PdfService {
    sanitize(s) {
        return (s ?? '').replace(/[ʻʼ‘’`´]/g, "'");
    }
    async generate(codes, opts) {
        const W = mm(opts.label?.width ?? 58);
        const H = mm(opts.label?.height ?? 45);
        const user = (opts.botUsername || 'bot').replace(/^@/, '');
        const text = this.sanitize(opts.text);
        const doc = new pdfkit_1.default({ size: [W, H], margin: 0 });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        const finished = new Promise((resolve) => doc.on('end', () => resolve()));
        const qrSize = mm(26);
        const pad = mm(2);
        let first = true;
        for (const code of codes) {
            if (!first)
                doc.addPage({ size: [W, H], margin: 0 });
            first = false;
            const url = opts.productId > 0
                ? `https://t.me/${user}?start=${code}`
                : `https://t.me/${user}`;
            const qrBuf = await QRCode.toBuffer(url, { margin: 1, width: 300 });
            doc.fillColor('#000').font('Helvetica-Bold').fontSize(7.5)
                .text(text, pad, mm(2), { width: W - pad * 2, align: 'center', height: mm(7), ellipsis: true });
            const qx = (W - qrSize) / 2;
            const qy = mm(10);
            doc.image(qrBuf, qx, qy, { width: qrSize, height: qrSize });
            doc.font('Courier-Bold').fontSize(12).fillColor('#000')
                .text(code, pad, H - mm(8.5), { width: W - pad * 2, align: 'center' });
        }
        doc.end();
        await finished;
        return Buffer.concat(chunks);
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map