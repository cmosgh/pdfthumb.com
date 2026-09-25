import { readFile } from "node:fs/promises";

const form = new FormData();
const pdf = new Uint8Array(await readFile("document.pdf"));
form.append(
  "file",
  new Blob([pdf], { type: "application/pdf" }),
  "document.pdf",
);

const response = await fetch("https://pdfthumb.com/api/thumbnail/count", {
  method: "POST",
  headers: { "x-api-key": process.env.PDFTHUMB_API_KEY ?? "" },
  body: form,
});
if (!response.ok) {
  throw new Error(`${response.status}: ${await response.text()}`);
}
const { pageCount } = (await response.json()) as { pageCount: number };
console.log(pageCount);
