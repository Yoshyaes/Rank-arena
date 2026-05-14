<?php
/**
 * Simple WordPress auth check for Rank Arena.
 * Bypasses the REST API nonce requirement by loading WordPress directly.
 * Place this in the /arena directory alongside index.html.
 */

// Load WordPress
$wp_load = dirname(dirname(__FILE__)) . '/wp-load.php';
if (!file_exists($wp_load)) {
    header('Content-Type: application/json');
    echo json_encode(['logged_in' => false, 'error' => 'WordPress not found']);
    exit;
}

require_once($wp_load);

header('Content-Type: application/json');

if (!is_user_logged_in()) {
    echo json_encode(['logged_in' => false]);
    exit;
}

$user = wp_get_current_user();

// Get BuddyPress display name if available
$display_name = $user->display_name;
if (function_exists('bp_core_get_user_displayname')) {
    $bp_name = bp_core_get_user_displayname($user->ID);
    if ($bp_name) {
        $display_name = $bp_name;
    }
}

$avatar_url = get_avatar_url($user->ID, ['size' => 96]);

echo json_encode([
    'logged_in'    => true,
    'id'           => $user->ID,
    'username'     => $user->user_login,
    'display_name' => $display_name,
    'avatar_url'   => $avatar_url,
]);
