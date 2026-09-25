using System.Net.Http.Headers;

using var client = new HttpClient();
client.DefaultRequestHeaders.Add(
    "x-api-key", Environment.GetEnvironmentVariable("PDFTHUMB_API_KEY"));

using var form = new MultipartFormDataContent();
var pdf = new ByteArrayContent(await File.ReadAllBytesAsync("document.pdf"));
pdf.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
form.Add(pdf, "file", "document.pdf");

using var response = await client.PostAsync(
    "https://pdfthumb.com/api/thumbnail/page?page=1&width=400", form);
response.EnsureSuccessStatusCode();
await File.WriteAllBytesAsync("page-1.jpg", await response.Content.ReadAsByteArrayAsync());
