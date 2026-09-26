# Hero proof (#140)

The landing hero shows a real request and the thumbnails our production API returned for it.

- `make-sample-pdf.mjs` draws `sample.pdf`: three A4 pages we made ourselves, so they're free to publish. Run `node scripts/hero-proof/make-sample-pdf.mjs scripts/hero-proof/sample.pdf`; the output is byte-identical on every run.
- `commands.txt` holds the exact calls, with the key redacted, and each response's status and type. They were made on 2026-09-26 against https://pdfthumb.com by the backend session, with its own key, because the frontend holds no API key.
- `src/assets/hero-proof/page-{1,2,3}.jpg` are those responses, unmodified (400×566 JPEG).

To refresh them, regenerate the PDF, have the backend repeat the calls in `commands.txt`, and replace all three files together. The hero's curl (`src/utils/curl.ts`) has to keep matching them.
