package main

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

func main() {
	pdf, err := os.ReadFile("document.pdf")
	if err != nil {
		panic(err)
	}

	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	part, err := form.CreateFormFile("file", "document.pdf")
	if err != nil {
		panic(err)
	}
	part.Write(pdf)
	form.Close()

	req, err := http.NewRequest(http.MethodPost,
		"https://pdfthumb.com/api/thumbnail/zip?width=400", &body)
	if err != nil {
		panic(err)
	}
	req.Header.Set("x-api-key", os.Getenv("PDFTHUMB_API_KEY"))
	req.Header.Set("Content-Type", form.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		panic(err)
	}
	if resp.StatusCode != http.StatusCreated {
		panic(fmt.Sprintf("%d: %s", resp.StatusCode, data))
	}
	if err := os.WriteFile("thumbnails.zip", data, 0o644); err != nil {
		panic(err)
	}
}
