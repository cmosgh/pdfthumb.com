package main

import (
	"bytes"
	"encoding/json"
	"fmt"
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
		"https://pdfthumb.com/api/thumbnail/count", &body)
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
	if resp.StatusCode != http.StatusCreated {
		panic(fmt.Sprintf("status %d", resp.StatusCode))
	}
	var result struct {
		PageCount int `json:"pageCount"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		panic(err)
	}
	fmt.Println(result.PageCount)
}
