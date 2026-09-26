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
using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
if (!response.IsSuccessStatusCode)
{
    var error = json.RootElement;
    var code = error.GetProperty("code").GetString();
    if (code == "RATE_LIMITED")
    {
        throw new Exception($"Rate limited: retry in {error.GetProperty("retryAfterSeconds").GetInt32()} s");
    }
    throw new Exception($"{(int)response.StatusCode} {code}: {error.GetProperty("message").GetString()}");
}
Console.WriteLine(json.RootElement.GetProperty("pageCount").GetInt32());
