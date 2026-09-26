// Writes sample.pdf: three A4 pages we drew ourselves, so the hero's proof
// thumbnails (#140) come from a document we're free to publish. No
// dependencies; the output is byte-for-byte the same on every run.
//
//   node scripts/hero-proof/make-sample-pdf.mjs scripts/hero-proof/sample.pdf
import { writeFileSync } from "node:fs";

const W = 595;
const H = 842;
const out = process.argv[2] ?? "sample.pdf";

const rgb = (hex) =>
  [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));
const rect = (x, y, w, h, hex) =>
  `${rgb(hex).join(" ")} rg ${x} ${y} ${w} ${h} re f`;
const text = (x, y, size, hex, s, font = "F2") =>
  `BT /${font} ${size} Tf ${rgb(hex).join(" ")} rg ${x} ${y} Td (${s}) Tj ET`;
// Grey bars standing in for lines of body text.
const lines = (x, y, n, width) =>
  Array.from({ length: n }, (_, i) =>
    rect(x, y - i * 16, i === n - 1 ? width * 0.6 : width, 7, "#cbd5e1"),
  );

const PAGES = [
  {
    accent: "#4f46e5",
    title: "Quarterly report",
    body: (a) => [
      ...lines(60, 620, 6, 475),
      // A bar chart.
      ...[100, 150, 125, 190, 165, 215].map((h, i) =>
        rect(80 + i * 75, 300, 45, h, i % 2 ? "#a5b4fc" : a),
      ),
      rect(60, 296, 475, 2, "#94a3b8"),
      ...lines(60, 250, 5, 475),
    ],
  },
  {
    accent: "#0d9488",
    title: "Product sheet",
    body: (a) => [
      rect(60, 420, 220, 220, "#ccfbf1"),
      rect(100, 460, 140, 140, a),
      ...lines(310, 630, 12, 225),
      ...[0, 1, 2].map((i) => rect(60 + i * 165, 200, 145, 170, "#f1f5f9")),
      ...[0, 1, 2].map((i) => rect(75 + i * 165, 330, 50, 25, a)),
      ...[0, 1, 2].flatMap((i) => lines(75 + i * 165, 300, 5, 115)),
    ],
  },
  {
    accent: "#e11d48",
    title: "Invoice",
    body: (a) => [
      ...lines(60, 640, 3, 200),
      ...lines(335, 640, 3, 200),
      rect(60, 540, 475, 26, "#f1f5f9"),
      ...[0, 1, 2, 3, 4, 5].flatMap((i) => [
        rect(70, 510 - i * 30, 250, 7, "#cbd5e1"),
        rect(455, 510 - i * 30, 70, 7, "#cbd5e1"),
      ]),
      rect(60, 320, 475, 2, "#94a3b8"),
      rect(335, 270, 200, 34, a),
      ...lines(60, 200, 4, 475),
    ],
  },
];

const pageContent = ({ accent, title, body }, n) =>
  [
    rect(0, H - 110, W, 110, accent),
    text(60, H - 70, 28, "#ffffff", title),
    text(
      60,
      H - 95,
      12,
      "#ffffff",
      `PDFThumb sample document  -  page ${n}`,
      "F1",
    ),
    ...body(accent),
    text(
      60,
      50,
      10,
      "#64748b",
      `pdfthumb.com  -  ${n} / ${PAGES.length}`,
      "F1",
    ),
  ].join("\n");

// Objects: 1 catalog, 2 pages, 3-4 fonts, then a page + contents per page.
const objects = [];
const add = (body) => objects.push(body) && objects.length;
add("<< /Type /Catalog /Pages 2 0 R >>");
add(null); // pages, filled in below
add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
const kids = PAGES.map((page, i) => {
  const content = pageContent(page, i + 1);
  const contents = add(
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  );
  return add(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contents} 0 R >>`,
  );
});
objects[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

let pdf = "%PDF-1.4\n";
const offsets = objects.map((body, i) => {
  const at = Buffer.byteLength(pdf);
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  return at;
});
const xref = Buffer.byteLength(pdf);
pdf +=
  `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
  offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") +
  `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(out, pdf);
