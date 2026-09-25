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
if ($status !== 201) {
    throw new RuntimeException("$status: $body");
}
echo json_decode($body, true)['pageCount'], PHP_EOL;
