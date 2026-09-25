curl -X POST "https://pdfthumb.com/api/thumbnail/count" \
  -H "x-api-key: $PDFTHUMB_API_KEY" \
  -F "file=@document.pdf;type=application/pdf" \
  --fail-with-body
# {"pageCount":12}
