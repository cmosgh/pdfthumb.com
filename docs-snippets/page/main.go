package main

import (
	"bytes"
	"encoding/json"
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
		"https://pdfthumb.com/api/thumbnail/page?page=1&width=400", &body)
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
		var apiErr struct {
			Code              string `json:"code"`
			Message           string `json:"message"`
			RetryAfterSeconds int    `json:"retryAfterSeconds"`
		}
		json.Unmarshal(data, &apiErr)
		if apiErr.Code == "RATE_LIMITED" {
			panic(fmt.Sprintf("rate limited: retry in %d s", apiErr.RetryAfterSeconds))
		}
		panic(fmt.Sprintf("%d %s: %s", resp.StatusCode, apiErr.Code, apiErr.Message))
	}
	if err := os.WriteFile("page-1.jpg", data, 0o644); err != nil {
		panic(err)
	}
}
