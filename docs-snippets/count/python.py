import os

import requests

with open("document.pdf", "rb") as pdf:
    response = requests.post(
        "https://pdfthumb.com/api/thumbnail/count",
        headers={"x-api-key": os.environ["PDFTHUMB_API_KEY"]},
        files={"file": ("document.pdf", pdf, "application/pdf")},
    )
response.raise_for_status()
print(response.json()["pageCount"])
