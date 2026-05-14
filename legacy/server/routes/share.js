const router = require('express').Router();
const sharp = require('sharp');
const { STAT_LABELS } = require('../lib/constants');


function getCommentary(score, total) {
  const pct = total > 0 ? score / total : 0;
  if (pct === 1) return 'FLAWLESS! Gaming encyclopedia!';
  if (pct >= 0.9) return 'So close to perfect!';
  if (pct >= 0.7) return 'Impressive knowledge!';
  if (pct >= 0.5) return 'Not bad \u2014 can you beat it?';
  if (pct >= 0.2) return 'Room for improvement!';
  return 'Better luck next time!';
}

function getScoreColor(score, total) {
  const pct = total > 0 ? score / total : 0;
  if (pct === 1) return '#F59E0B';   // gold
  if (pct >= 0.7) return '#22C55E';  // green
  if (pct >= 0.4) return '#3B82F6';  // blue
  return '#EF4444';                   // red
}

function buildTrailSVG(trail, startX, y) {
  const size = 28;
  const gap = 6;
  let svg = '';
  for (let i = 0; i < trail.length; i++) {
    const x = startX + i * (size + gap);
    const isCorrect = trail[i] === '1';
    const fill = isCorrect ? '#22C55E' : '#EF4444';
    const bgFill = isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
    svg += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="6" fill="${bgFill}" stroke="${fill}" stroke-width="1.5" stroke-opacity="0.4"/>`;
    if (isCorrect) {
      svg += `<path d="M${x + 8} ${y + 15} l3 3 l7 -8" fill="none" stroke="${fill}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      svg += `<path d="M${x + 9} ${y + 9} l10 10 M${x + 19} ${y + 9} l-10 10" fill="none" stroke="${fill}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
  }
  return svg;
}

function buildScoreRing(cx, cy, r, pct, color) {
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * pct);
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1E2530" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
      stroke-linecap="round" stroke-dasharray="${circumference.toFixed(1)}"
      stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
  `;
}

// GET /api/share/image?s=4&t=10&n=4&c=avg_playtime_hours&trail=11110&streak=1
router.get('/image', async (req, res) => {
  try {
    const score = parseInt(req.query.s) || 0;
    const total = parseInt(req.query.t) || 10;
    const challengeNum = parseInt(req.query.n) || 1;
    const statCategory = req.query.c || 'metacritic';
    const trail = req.query.trail || '';
    const streakDays = parseInt(req.query.streak) || 0;
    const dateStr = req.query.d || new Date().toISOString().split('T')[0];

    const statLabel = STAT_LABELS[statCategory] || statCategory;
    const pct = total > 0 ? score / total : 0;
    const color = getScoreColor(score, total);
    const commentary = getCommentary(score, total);
    const isPerfect = score === total;

    // Format date
    const dt = new Date(dateStr + 'T00:00:00Z');
    const formattedDate = dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

    const width = 600;
    const height = 440;

    // Trail positioning
    const trailLen = trail.length || total;
    const trailItemW = 34; // size + gap
    const trailTotalW = trailLen * trailItemW - 6;
    const trailStartX = (width - trailTotalW) / 2;

    const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#111418"/>
      <stop offset="100%" stop-color="#080B0F"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" rx="20" fill="url(#bgGrad)"/>
  <rect width="${width}" height="${height}" rx="20" fill="none" stroke="#1E2530" stroke-width="1.5"/>

  <!-- Header gradient bar -->
  <rect y="0" width="${width}" height="70" rx="20" fill="url(#headerGrad)"/>
  <rect y="20" width="${width}" height="50" fill="url(#headerGrad)"/>

  <!-- Title -->
  <text x="${width / 2}" y="32" text-anchor="middle" font-family="'Space Grotesk', 'Segoe UI', sans-serif" font-size="20" font-weight="800" fill="#F59E0B" letter-spacing="2">RANK ARENA</text>
  <text x="${width / 2}" y="55" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-size="13" fill="rgba(255,255,255,0.8)">Daily #${challengeNum} \u2022 ${formattedDate}</text>

  <!-- Stat category badge -->
  <rect x="${width / 2 - 70}" y="85" width="140" height="28" rx="14" fill="#1C2128" stroke="#1E2530" stroke-width="1"/>
  <text x="${width / 2}" y="104" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" font-weight="600" fill="#64748B">${statLabel}</text>

  <!-- Score ring -->
  ${buildScoreRing(width / 2, 185, 50, pct, color)}

  <!-- Score text -->
  <text x="${width / 2}" y="192" text-anchor="middle" font-family="'Space Grotesk', 'Segoe UI', sans-serif" font-size="36" font-weight="800" fill="${color}">${score}</text>
  <text x="${width / 2}" y="212" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" fill="#64748B">/ ${total}</text>

  <!-- Commentary -->
  <text x="${width / 2}" y="260" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-size="14" font-weight="600" fill="${isPerfect ? '#F59E0B' : '#94A3B8'}">${isPerfect ? '\u2728 ' : ''}${commentary}${isPerfect ? ' \u2728' : ''}</text>

  <!-- Emoji trail -->
  ${buildTrailSVG(trail, trailStartX, 280)}

  <!-- Streak -->
  ${streakDays > 0 ? `
    <text x="${width / 2}" y="340" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-size="13" fill="#64748B">\u{1F525} ${streakDays} day streak</text>
  ` : ''}

  <!-- Footer -->
  <text x="${width / 2}" y="${height - 20}" text-anchor="middle" font-family="'Inter', 'Segoe UI', sans-serif" font-size="12" font-weight="600" fill="#64748B">Can you beat me? \u2022 twoaveragegamers.com/arena</text>
</svg>`;

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(pngBuffer);
  } catch (err) {
    console.error('Share image error:', err);
    res.status(500).json({ message: 'Failed to generate image' });
  }
});

module.exports = router;
