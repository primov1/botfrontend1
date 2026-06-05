import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

const MM = 2.83465; // 1mm = 2.83465pt
const mm = (n: number) => n * MM;

export interface PdfOptions {
    botUsername: string;
    text: string;
    productId: number;   // 0 bo'lsa QR-2 ham oddiy bot linki
    label?: { width: number; height: number }; // mm
}

@Injectable()
export class PdfService {
    /** Uzbek matnini standart shrift uchun moslash (maxsus apostroflar -> '). */
    private sanitize(s: string): string {
        return (s ?? '').replace(/[ʻʼ‘’`´]/g, "'");
    }

    /**
     * Stikerlar PDF (xprinter uchun) — har stiker alohida sahifa (yorliq o'lchami).
     * Har stikerda: admin matni, 1 QR (?start=KOD), 7 talik kod.
     */
    async generate(codes: string[], opts: PdfOptions): Promise<Buffer> {
        const W = mm(opts.label?.width ?? 58);
        const H = mm(opts.label?.height ?? 45);
        const user = (opts.botUsername || 'bot').replace(/^@/, '');
        const text = this.sanitize(opts.text);

        const doc = new PDFDocument({ size: [W, H], margin: 0 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        const finished = new Promise<void>((resolve) => doc.on('end', () => resolve()));

        const qrSize = mm(26);
        const pad = mm(2);

        let first = true;
        for (const code of codes) {
            if (!first) doc.addPage({ size: [W, H], margin: 0 });
            first = false;

            // Yagona QR — kod bilan (mahsulot bo'lsa ?start=KOD, aks holda oddiy link)
            const url = opts.productId > 0
                ? `https://t.me/${user}?start=${code}`
                : `https://t.me/${user}`;
            const qrBuf = await QRCode.toBuffer(url, { margin: 1, width: 300 });

            // Admin matni (tepada)
            doc.fillColor('#000').font('Helvetica-Bold').fontSize(7.5)
                .text(text, pad, mm(2), { width: W - pad * 2, align: 'center', height: mm(7), ellipsis: true });

            // QR — markazda
            const qx = (W - qrSize) / 2;
            const qy = mm(10);
            doc.image(qrBuf, qx, qy, { width: qrSize, height: qrSize });

            // 7 talik kod (pastda)
            doc.font('Courier-Bold').fontSize(12).fillColor('#000')
                .text(code, pad, H - mm(8.5), { width: W - pad * 2, align: 'center' });
        }

        doc.end();
        await finished;
        return Buffer.concat(chunks);
    }
}
