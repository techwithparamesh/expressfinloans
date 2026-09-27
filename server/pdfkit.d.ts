declare module "pdfkit" {
  namespace PDFDocument {
    interface PDFDocumentOptions {
      margin?: number;
      size?: string | [number, number];
      layout?: string;
    }
    interface TextOptions {
      align?: string;
      width?: number;
      height?: number;
      lineGap?: number;
      continued?: boolean;
      lineBreak?: boolean;
      ellipsis?: boolean | string;
      underline?: boolean;
    }
    interface ImageOptions {
      fit?: [number, number];
      width?: number;
      height?: number;
      align?: string;
      valign?: string;
    }
    interface Page {
      width: number;
      height: number;
      margins: { top: number; bottom: number; left: number; right: number };
    }
    interface PDFDocument {
      page: Page;
      x: number;
      y: number;
      pipe<T extends NodeJS.WritableStream>(dest: T): T;
      end(): void;
      addPage(options?: PDFDocumentOptions): this;
      font(name: string, size?: number): this;
      fontSize(size: number): this;
      fillColor(color: string, opacity?: number): this;
      text(text: string, options?: TextOptions): this;
      text(text: string, x?: number, y?: number, options?: TextOptions): this;
      heightOfString(text: string, options?: TextOptions): number;
      currentLineHeight(includeGap?: boolean): number;
      moveDown(lines?: number): this;
      moveTo(x: number, y: number): this;
      lineTo(x: number, y: number): this;
      rect(x: number, y: number, w: number, h: number): this;
      stroke(color?: string): this;
      image(src: string | Buffer, x?: number, y?: number, options?: ImageOptions): this;
    }
  }
  const PDFDocument: new (options?: PDFDocument.PDFDocumentOptions) => PDFDocument.PDFDocument;
  export = PDFDocument;
}
