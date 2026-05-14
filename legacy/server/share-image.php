<?php
/**
 * PHP proxy for share card image generation.
 * Proxies the request to Node.js on localhost:3001 and returns the PNG.
 * This avoids mixed content (HTTPS→HTTP) and Cloudflare port issues.
 */

$params = $_GET;
$queryString = http_build_query($params);
$url = "http://127.0.0.1:3001/api/share/image?" . $queryString;

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 15,
        'ignore_errors' => true,
    ]
]);

$image = file_get_contents($url, false, $context);

if ($image === false) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo 'Failed to generate image';
    exit;
}

header('Content-Type: image/png');
header('Cache-Control: public, max-age=86400');
echo $image;
