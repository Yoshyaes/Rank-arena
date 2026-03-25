<?php
/**
 * Plugin Name: Rank Arena Auth
 * Description: Provides WordPress authentication bridge for Rank Arena game
 * Version: 1.0.0
 * Author: Two Average Gamers
 */

if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    // GET /wp-json/rank-arena/v1/me
    register_rest_route('rank-arena/v1', '/me', [
        'methods'  => 'GET',
        'callback' => 'rank_arena_get_current_user',
        'permission_callback' => '__return_true',
    ]);
});

function rank_arena_get_current_user(WP_REST_Request $request) {
    if (!is_user_logged_in()) {
        return new WP_REST_Response([
            'logged_in' => false,
        ], 200);
    }

    $user = wp_get_current_user();
    $avatar_url = get_avatar_url($user->ID, ['size' => 96]);

    // Get BuddyPress display name if available
    $display_name = $user->display_name;
    if (function_exists('bp_core_get_user_displayname')) {
        $bp_name = bp_core_get_user_displayname($user->ID);
        if ($bp_name) {
            $display_name = $bp_name;
        }
    }

    return new WP_REST_Response([
        'logged_in'    => true,
        'id'           => $user->ID,
        'username'     => $user->user_login,
        'display_name' => $display_name,
        'email'        => $user->user_email,
        'avatar_url'   => $avatar_url,
    ], 200);
}
