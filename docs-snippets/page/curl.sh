curl -X POST "https://pdfthumb.com/api/thumbnail/page?page=1&width=400" \
  -H "x-api-key: $PDFTHUMB_API_KEY" \
  -F "file=@document.pdf;type=application/pdf" \
  --fail-with-body \
  -o page-1.jpg
