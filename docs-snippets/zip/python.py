import os

import requests

with open("document.pdf", "rb") as pdf:
    response = requests.post(
        "https://pdfthumb.com/api/thumbnail/zip?width=400",
        headers={"x-api-key": os.environ["PDFTHUMB_API_KEY"]},
        files={"file": ("document.pdf", pdf, "application/pdf")},
    )
response.raise_for_status()
with open("thumbnails.zip", "wb") as out:
    out.write(response.content)
