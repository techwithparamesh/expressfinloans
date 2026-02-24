declare module "pdfkit" {
  interface PDFDocumentOptions {
    margin?: number;
  }
  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    pipe(dest: NodeJS.WritableStream): this;
    end(): void;
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: { align?: string }): this;
    moveDown(n?: number): this;
    y: number;
  }
  export = PDFDocument;
}
