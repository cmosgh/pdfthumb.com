import { readFile, writeFile } from "node:fs/promises";

const form = new FormData();
const pdf = new Uint8Array(await readFile("document.pdf"));
form.append(
  "file",
  new Blob([pdf], { type: "application/pdf" }),
  "document.pdf",
);

const response = await fetch(
  "https://pdfthumb.com/api/thumbnail/page?page=1&width=400",
  {
    method: "POST",
    headers: { "x-api-key": process.env.PDFTHUMB_API_KEY ?? "" },
    body: form,
  },
);
if (!response.ok) {
  throw new Error(`${response.status}: ${await response.text()}`);
}
await writeFile("page-1.jpg", Buffer.from(await response.arrayBuffer()));
