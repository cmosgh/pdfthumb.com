import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Main {
    public static void main(String[] args) throws Exception {
        // java.net.http has no multipart helper, so build the form by hand.
        String boundary = "pdfthumb-" + UUID.randomUUID();
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"document.pdf\"\r\n"
                + "Content-Type: application/pdf\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(Files.readAllBytes(Path.of("document.pdf")));
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://pdfthumb.com/api/thumbnail/count"))
                .header("x-api-key", System.getenv("PDFTHUMB_API_KEY"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                .build();

        HttpResponse<String> response = HttpClient.newHttpClient()
                .send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 201) {
            String errorBody = response.body();
            // No JSON parser in the stdlib; pull "code" out with a regex.
            Matcher codeMatch = Pattern.compile("\"code\"\\s*:\\s*\"([^\"]+)\"").matcher(errorBody);
            String code = codeMatch.find() ? codeMatch.group(1) : "UNKNOWN";
            if (code.equals("RATE_LIMITED")) {
                Matcher retryMatch = Pattern.compile("\"retryAfterSeconds\"\\s*:\\s*(\\d+)").matcher(errorBody);
                throw new RuntimeException("Rate limited: retry in " + (retryMatch.find() ? retryMatch.group(1) : "?") + " s");
            }
            throw new RuntimeException(response.statusCode() + " " + code + ": " + errorBody);
        }
        System.out.println(response.body()); // {"pageCount":12}
    }
}
