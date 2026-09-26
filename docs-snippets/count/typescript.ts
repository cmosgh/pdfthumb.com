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
  const error = (await response.json()) as {
    code: string;
    message: string;
    retryAfterSeconds?: number;
  };
  if (error.code === "RATE_LIMITED") {
    throw new Error(`Rate limited: retry in ${error.retryAfterSeconds} s`);
  }
  throw new Error(`${response.status} ${error.code}: ${error.message}`);
}
const { pageCount } = (await response.json()) as { pageCount: number };
console.log(pageCount);
