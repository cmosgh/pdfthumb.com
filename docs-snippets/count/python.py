import os

import requests

with open("document.pdf", "rb") as pdf:
    response = requests.post(
        "https://pdfthumb.com/api/thumbnail/count",
        headers={"x-api-key": os.environ["PDFTHUMB_API_KEY"]},
        files={"file": ("document.pdf", pdf, "application/pdf")},
    )
if not response.ok:
    error = response.json()
    if error["code"] == "RATE_LIMITED":
        raise RuntimeError(f"Rate limited: retry in {error['retryAfterSeconds']} s")
    raise RuntimeError(f"{response.status_code} {error['code']}: {error['message']}")
print(response.json()["pageCount"])
