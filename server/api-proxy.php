<?php
/**
 * PHP proxy for Rank Arena API.
 * Forwards requests from /arena/api/* to localhost:3001/api/*
 * This is needed because Cloudflare only proxies ports 80/443,
 * and Apache proxy modules aren't available without sudo on Cloudways.
 */

// Get the API path from the query string
$path = isset($_GET['path']) ? $_GET['path'] : '';
$path = ltrim($path, '/');

$target = "http://127.0.0.1:3001/api/" . $path;

// Forward query string (excluding our 'path' param)
$queryParams = $_GET;
unset($queryParams['path']);
if (!empty($queryParams)) {
    $target .= '?' . http_build_query($queryParams);
}

// Read request body for POST requests
$body = file_get_contents('php://input');

// Set up the request
$options = [
    'http' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'header' => "Content-Type: application/json\r\n",
        'ignore_errors' => true,
        'timeout' => 10,
    ]
];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $body) {
    $options['http']['content'] = $body;
}

// Forward Authorization header if present
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $options['http']['header'] .= "Authorization: " . $_SERVER['HTTP_AUTHORIZATION'] . "\r\n";
}

$context = stream_context_create($options);
$response = file_get_contents($target, false, $context);

// Get response code from headers
$statusCode = 200;
if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (preg_match('/^HTTP\/\d\.\d (\d{3})/', $header, $matches)) {
            $statusCode = intval($matches[1]);
        }
    }
}

// Send response
http_response_code($statusCode);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

echo $response;
