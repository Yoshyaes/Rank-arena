<?php
/**
 * PHP proxy for Rank Arena API.
 * Forwards requests from /arena/api-proxy.php?path=X to localhost:3001/api/X
 * Also injects WordPress user identity for authenticated requests.
 */

// Load WordPress to check auth (wp-load.php is in the site root)
$wp_load = dirname(dirname(__FILE__)) . '/wp-load.php';
if (file_exists($wp_load)) {
    define('SHORTINIT', false);
    require_once($wp_load);
}

// Get the API path
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

// If WordPress user is logged in, inject user info into POST body for score submissions
if (function_exists('is_user_logged_in') && is_user_logged_in()) {
    $wp_user = wp_get_current_user();
    $display_name = $wp_user->display_name;
    if (function_exists('bp_core_get_user_displayname')) {
        $bp_name = bp_core_get_user_displayname($wp_user->ID);
        if ($bp_name) $display_name = $bp_name;
    }

    // For POST requests, inject wp_user into the body
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $body) {
        $data = json_decode($body, true);
        if (is_array($data)) {
            $data['wp_user_id'] = (string) $wp_user->ID;
            $data['wp_display_name'] = $display_name;
            $body = json_encode($data);
        }
    }
}

// Set up the request
$headers = "Content-Type: application/json\r\n";

// Forward Authorization header if present
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $headers .= "Authorization: " . $_SERVER['HTTP_AUTHORIZATION'] . "\r\n";
}

$options = [
    'http' => [
        'method'        => $_SERVER['REQUEST_METHOD'],
        'header'        => $headers,
        'ignore_errors' => true,
        'timeout'       => 10,
    ]
];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $body) {
    $options['http']['content'] = $body;
}

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
    exit;
}

$context = stream_context_create($options);
$response = file_get_contents($target, false, $context);

// Get response code
$statusCode = 200;
if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (preg_match('/^HTTP\/\d\.\d (\d{3})/', $header, $matches)) {
            $statusCode = intval($matches[1]);
        }
    }
}

http_response_code($statusCode);
header('Content-Type: application/json');
echo $response;
