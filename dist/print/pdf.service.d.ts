export interface PdfOptions {
    botUsername: string;
    text: string;
    productId: number;
    label?: {
        width: number;
        height: number;
    };
}
export declare class PdfService {
    private sanitize;
    generate(codes: string[], opts: PdfOptions): Promise<Buffer>;
}
