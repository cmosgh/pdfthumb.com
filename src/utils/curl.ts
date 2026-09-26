import { PUBLIC_API_URL } from "../constants";

// The curl for one page's thumbnail, as /docs teaches it and as the hero
// ran it against production (scripts/hero-proof/commands.txt, #140).
export const pageThumbnailCurl = (file: string, page = 1, width = 400) =>
  `curl -X POST "${PUBLIC_API_URL}/thumbnail/page?page=${page}&width=${width}" \\
  -H "x-api-key: $PDFTHUMB_API_KEY" \\
  -F "file=@${file}" \\
  -o page-${page}.jpg`;
