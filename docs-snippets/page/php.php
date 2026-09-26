<?php
$ch = curl_init('https://pdfthumb.com/api/thumbnail/page?page=1&width=400');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['x-api-key: ' . getenv('PDFTHUMB_API_KEY')],
    CURLOPT_POSTFIELDS => [
        'file' => new CURLFile('document.pdf', 'application/pdf', 'document.pdf'),
    ],
    CURLOPT_RETURNTRANSFER => true,
]);
$body = curl_exec($ch);
if ($body === false) {
    throw new RuntimeException(curl_error($ch));
}
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
if ($status !== 201) {
    $error = json_decode($body, true);
    if (($error['code'] ?? null) === "RATE_LIMITED") {
        throw new RuntimeException("Rate limited: retry in {$error['retryAfterSeconds']} s");
    }
    throw new RuntimeException("$status {$error['code']}: {$error['message']}");
}
file_put_contents('page-1.jpg', $body);
