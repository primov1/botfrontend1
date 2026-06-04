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
     * Har stikerda: admin matni, 2 QR (kirish + ?start=KOD), 7 talik kod.
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

        // QR-1 — barcha stiker uchun bir xil (oddiy kirish)
        const qrEntry = await QRCode.toBuffer(`https://t.me/${user}`, { margin: 1, width: 240 });

        const qrSize = mm(17);
        const pad = mm(2);

        let first = true;
        for (const code of codes) {
            if (!first) doc.addPage({ size: [W, H], margin: 0 });
            first = false;

            // QR-2 — kod bilan (mahsulot bo'lsa ?start, aks holda oddiy link)
            const url2 = opts.productId > 0
                ? `https://t.me/${user}?start=${code}`
                : `https://t.me/${user}`;
            const qrConfirm = await QRCode.toBuffer(url2, { margin: 1, width: 240 });

            // Admin matni (tepada)
            doc.fillColor('#000').font('Helvetica-Bold').fontSize(7.5)
                .text(text, pad, mm(2), { width: W - pad * 2, align: 'center', height: mm(7), ellipsis: true });

            // 2 ta QR
            const qy = mm(10);
            const leftX = W / 2 - qrSize - mm(2);
            const rightX = W / 2 + mm(2);
            doc.image(qrEntry, leftX, qy, { width: qrSize, height: qrSize });
            doc.image(qrConfirm, rightX, qy, { width: qrSize, height: qrSize });

            // QR yorliqlari
            doc.font('Helvetica').fontSize(5).fillColor('#222')
                .text('Botga kirish', leftX, qy + qrSize + mm(0.6), { width: qrSize, align: 'center' })
                .text('Tasdiqlash', rightX, qy + qrSize + mm(0.6), { width: qrSize, align: 'center' });

            // 7 talik kod (pastda)
            doc.font('Courier-Bold').fontSize(12).fillColor('#000')
                .text(code, pad, H - mm(8.5), { width: W - pad * 2, align: 'center' });
        }

        doc.end();
        await finished;
        return Buffer.concat(chunks);
    }
}
