import PDFDocument from "pdfkit";
import { PerformanceReport } from "../Domain/models/PerformanceReport";

export function generatePerformanceReportPdf(
  report: PerformanceReport
): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    // ===== PDF CONTENT =====

    doc.fontSize(20).text("Performance Analysis Report", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12);
    doc.text(`Report ID: ${report.id}`);
    doc.text(`Algorithm: ${report.algorithmName}`);
    doc.text(`Created at: ${new Date(report.createdAt).toLocaleString()}`);

    doc.moveDown();

    doc.fontSize(14).text("Metrics", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12);
    doc.text(`Execution Time: ${report.executionTime} ms`);
    doc.text(`Success Rate: ${report.successRate} %`);
    doc.text(`Resource Usage: ${report.resourceUsage} %`);

    doc.moveDown();
    // =======================

    doc.end();
  });
}
