curl -X POST "https://pdfthumb.com/api/thumbnail/zip?width=400" \
  -H "x-api-key: $PDFTHUMB_API_KEY" \
  -F "file=@document.pdf;type=application/pdf" \
  --fail-with-body \
  -o thumbnails.zip
