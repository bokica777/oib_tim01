export type PdfBlockType = "title" | "subtitle" | "paragraph" | "table" | "metric" | "spacer";

export interface PdfMeta {
  reportId: number;
  reportType: string;
  createdAt: string;      // ISO
  createdBy?: string | null;
  period?: { from?: string | null; to?: string | null };
  params?: any;
}

export interface PdfMetric {
  label: string;
  value: string | number;
}

export interface PdfTableColumn {
  key: string;     // key in row object
  label: string;   // header label
}

export interface PdfTableBlock {
  type: "table";
  title?: string;
  columns: PdfTableColumn[];
  rows: Record<string, any>[];
  footerNote?: string;
}

export interface PdfMetricBlock {
  type: "metric";
  title?: string;
  metrics: PdfMetric[];
}

export interface PdfTextBlock {
  type: "title" | "subtitle" | "paragraph" | "spacer";
  text?: string;
}

export type PdfBlock = PdfTextBlock | PdfTableBlock | PdfMetricBlock;

export interface PdfDocument {
  meta: PdfMeta;
  blocks: PdfBlock[];
}
