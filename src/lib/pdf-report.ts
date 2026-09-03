import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface RunLogEntry {
  email:    string;
  contact:  string;
  campaign: string;
  step:     number;
  status:   "sent" | "skipped" | "failed";
  timestamp: string;
  note?:    string;
}

export interface RunSummary {
  campaignName:  string;
  startedAt:     string;
  completedAt:   string;
  totalSent:     number;
  totalSkipped:  number;
  totalFailed:   number;
  entries:       RunLogEntry[];
}

// A4 at 72 dpi = 595 × 842 pts. Origin is bottom-left in pdf-lib.
const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

// Convert "top-down y" → pdf-lib bottom-left y
function py(topY: number) { return PAGE_H - topY; }

const C = {
  blue:    rgb(0.12, 0.25, 0.69),
  dark:    rgb(0.06, 0.09, 0.15),
  slate:   rgb(0.39, 0.45, 0.55),
  light:   rgb(0.97, 0.98, 0.99),
  header:  rgb(0.12, 0.18, 0.24),
  white:   rgb(1,    1,    1),
  green:   rgb(0.09, 0.64, 0.26),
  amber:   rgb(0.85, 0.60, 0.08),
  red:     rgb(0.86, 0.15, 0.15),
  summaryBg: rgb(0.94, 0.97, 1),
  summaryBorder: rgb(0.73, 0.90, 0.99),
};

export async function generateRunReportPDF(summary: RunSummary): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const fontReg  = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let top  = 50; // current cursor from top of page

  // Add a new page when we'd overflow
  function maybeNewPage(neededPts: number) {
    if (top + neededPts > PAGE_H - MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      top  = 50;
    }
  }

  // ── Header ──────────────────────────────────────────────────────────────
  page.drawText("Yesp Flow - Campaign Run Report", {
    x: MARGIN, y: py(top + 18),
    size: 17, font: fontBold, color: C.blue,
  });
  top += 26;

  page.drawText(summary.campaignName, {
    x: MARGIN, y: py(top + 13),
    size: 13, font: fontBold, color: C.dark,
  });
  top += 20;

  page.drawText(
    `Started: ${summary.startedAt}   |   Completed: ${summary.completedAt}`,
    { x: MARGIN, y: py(top + 9), size: 8, font: fontReg, color: C.slate }
  );
  top += 18;

  // ── Summary box ──────────────────────────────────────────────────────────
  const boxH = 54;
  page.drawRectangle({
    x: MARGIN, y: py(top + boxH),
    width: CONTENT_W, height: boxH,
    color: C.summaryBg, borderColor: C.summaryBorder, borderWidth: 1,
  });

  page.drawText("SUMMARY", {
    x: MARGIN + 10, y: py(top + 14),
    size: 7.5, font: fontBold, color: C.blue,
  });

  const cols = [MARGIN + 10, MARGIN + 130, MARGIN + 265, MARGIN + 390];
  const statLabels = ["Sent", "Skipped", "Failed", "Total"];
  const statVals   = [
    String(summary.totalSent),
    String(summary.totalSkipped),
    String(summary.totalFailed),
    String(summary.entries.length),
  ];
  const statColors = [C.green, C.amber, C.red, C.blue];

  statLabels.forEach((lbl, i) => {
    page.drawText(lbl, {
      x: cols[i], y: py(top + 28), size: 7.5, font: fontReg, color: C.slate,
    });
    page.drawText(statVals[i], {
      x: cols[i], y: py(top + 44), size: 14, font: fontBold, color: statColors[i],
    });
  });

  top += boxH + 12;

  // ── Table header ─────────────────────────────────────────────────────────
  const ROW_H   = 16;
  const COL = {
    contact:  MARGIN,
    email:    MARGIN + 100,
    step:     MARGIN + 250,
    status:   MARGIN + 288,
    time:     MARGIN + 358,
    note:     MARGIN + 430,
  };

  page.drawRectangle({
    x: MARGIN, y: py(top + ROW_H),
    width: CONTENT_W, height: ROW_H,
    color: C.header,
  });

  const thY = py(top + ROW_H - 5);
  [
    [COL.contact, "CONTACT"],
    [COL.email,   "EMAIL"],
    [COL.step,    "STEP"],
    [COL.status,  "STATUS"],
    [COL.time,    "TIME"],
    [COL.note,    "NOTE"],
  ].forEach(([x, label]) => {
    page.drawText(String(label), {
      x: Number(x) + 2, y: thY,
      size: 7, font: fontBold, color: C.white,
    });
  });
  top += ROW_H;

  // ── Rows ─────────────────────────────────────────────────────────────────
  for (let i = 0; i < summary.entries.length; i++) {
    maybeNewPage(ROW_H + 2);

    const e   = summary.entries[i];
    const bg  = i % 2 === 0 ? C.light : C.white;
    const rowY = py(top + ROW_H);

    page.drawRectangle({
      x: MARGIN, y: rowY,
      width: CONTENT_W, height: ROW_H,
      color: bg,
    });

    const textY = rowY + 5;
    const statusColor = e.status === "sent" ? C.green : e.status === "failed" ? C.red : C.amber;

    const truncate = (s: string, maxLen: number) =>
      s.length > maxLen ? s.slice(0, maxLen - 1) + "..." : s;

    page.drawText(truncate(e.contact, 18), {
      x: COL.contact + 2, y: textY, size: 7, font: fontReg, color: C.dark,
    });
    page.drawText(truncate(e.email, 26), {
      x: COL.email + 2, y: textY, size: 7, font: fontReg, color: C.dark,
    });
    page.drawText(`#${e.step}`, {
      x: COL.step + 2, y: textY, size: 7, font: fontReg, color: C.slate,
    });
    page.drawText(e.status.toUpperCase(), {
      x: COL.status + 2, y: textY, size: 7, font: fontBold, color: statusColor,
    });
    page.drawText(
      new Date(e.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      }),
      { x: COL.time + 2, y: textY, size: 7, font: fontReg, color: C.slate }
    );
    if (e.note) {
      page.drawText(truncate(e.note, 18), {
        x: COL.note + 2, y: textY, size: 6.5, font: fontReg, color: C.slate,
      });
    }

    top += ROW_H;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  maybeNewPage(20);
  top += 12;
  page.drawText(`Generated by Yesp Flow · ${new Date().toLocaleString()}`, {
    x: MARGIN, y: py(top + 9), size: 7.5, font: fontReg, color: C.slate,
  });

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
