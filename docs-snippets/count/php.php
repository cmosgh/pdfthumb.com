<?php
$ch = curl_init('https://pdfthumb.com/api/thumbnail/count');
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
$result = json_decode($body, true);
if ($status !== 201) {
    if (($result['code'] ?? null) === "RATE_LIMITED") {
        throw new RuntimeException("Rate limited: retry in {$result['retryAfterSeconds']} s");
    }
    throw new RuntimeException("$status {$result['code']}: {$result['message']}");
}
echo $result['pageCount'], PHP_EOL;
