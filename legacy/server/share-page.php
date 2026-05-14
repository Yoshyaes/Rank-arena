<?php
/**
 * Dynamic share page for Rank Arena.
 * When Discord/Twitter/social media bots crawl this URL, they get OG meta tags
 * pointing to the generated share card image.
 * When a real user visits, they get redirected to the game.
 *
 * URL: /arena/share.php?s=4&t=10&n=4&c=avg_playtime_hours&trail=11110&streak=1&d=2026-03-25
 */

$score = isset($_GET['s']) ? intval($_GET['s']) : 0;
$total = isset($_GET['t']) ? intval($_GET['t']) : 10;
$challengeNum = isset($_GET['n']) ? intval($_GET['n']) : 1;
$statCategory = isset($_GET['c']) ? $_GET['c'] : 'metacritic';
$trail = isset($_GET['trail']) ? $_GET['trail'] : '';
$streak = isset($_GET['streak']) ? intval($_GET['streak']) : 0;
$dateStr = isset($_GET['d']) ? $_GET['d'] : date('Y-m-d');

$statLabels = [
    'metacritic' => 'Metacritic Score',
    'sales_millions' => 'Total Sales',
    'peak_players' => 'Peak Steam Players',
    'avg_playtime_hours' => 'Avg Playtime',
    'user_score' => 'User Score',
];
$statLabel = isset($statLabels[$statCategory]) ? $statLabels[$statCategory] : $statCategory;

// Build image URL (points to Node.js server directly since port 3001 is accessible)
$imageParams = http_build_query([
    's' => $score,
    't' => $total,
    'n' => $challengeNum,
    'c' => $statCategory,
    'trail' => $trail,
    'streak' => $streak,
    'd' => $dateStr,
]);

// Image URL goes through PHP proxy (same domain, no port issues)
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$imageUrl = "$scheme://$host/arena/share-image.php?" . $imageParams;

$title = "Rank Arena Daily #$challengeNum — $score/$total";
$description = "$statLabel • " . ($score == $total ? "FLAWLESS!" : "$score out of $total correct") . " • Can you beat me?";

// Check if this is a bot/crawler (Discord, Twitter, Facebook, etc.)
$userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? strtolower($_SERVER['HTTP_USER_AGENT']) : '';
$isCrawler = (
    strpos($userAgent, 'bot') !== false ||
    strpos($userAgent, 'crawler') !== false ||
    strpos($userAgent, 'spider') !== false ||
    strpos($userAgent, 'discord') !== false ||
    strpos($userAgent, 'twitter') !== false ||
    strpos($userAgent, 'facebook') !== false ||
    strpos($userAgent, 'whatsapp') !== false ||
    strpos($userAgent, 'telegram') !== false ||
    strpos($userAgent, 'slack') !== false ||
    strpos($userAgent, 'linkedin') !== false
);

// If it's a real user (not a crawler), redirect to the game
if (!$isCrawler) {
    header('Location: /arena/');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo htmlspecialchars($title); ?></title>

    <!-- Open Graph -->
    <meta property="og:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($imageUrl); ?>">
    <meta property="og:image:width" content="600">
    <meta property="og:image:height" content="440">
    <meta property="og:url" content="https://twoaveragegamers.com/arena/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Rank Arena by Two Average Gamers">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($title); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($description); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($imageUrl); ?>">
</head>
<body>
    <p>Redirecting to Rank Arena...</p>
    <script>window.location.href = '/arena/';</script>
</body>
</html>
