using System.Net.Http.Headers;
using System.Text.Json;

using var client = new HttpClient();
client.DefaultRequestHeaders.Add(
    "x-api-key", Environment.GetEnvironmentVariable("PDFTHUMB_API_KEY"));

using var form = new MultipartFormDataContent();
var pdf = new ByteArrayContent(await File.ReadAllBytesAsync("document.pdf"));
pdf.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
form.Add(pdf, "file", "document.pdf");

using var response = await client.PostAsync(
    "https://pdfthumb.com/api/thumbnail/count", form);
response.EnsureSuccessStatusCode();
using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
Console.WriteLine(json.RootElement.GetProperty("pageCount").GetInt32());
