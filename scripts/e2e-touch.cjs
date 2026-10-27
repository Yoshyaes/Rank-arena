// Rank Arena touch e2e (ARCADE-TOUCH-CONTROLS.md Phases 2+3): the built plugin dist
// (postbuild copies it into TAG Wordpress Website/tag-arcade/rank-arena/plugin) +
// mocked REST, in headless Chromium. Touch at 390x844, 844x390, 360x740 with Touch
// Kit 1.1, plus kit 1.0.0, no kit, reduced motion and desktop.
// node scripts/e2e-touch.cjs [shotsDir]  -> exits 1 on any failure.
// Env: PLUGIN_DIR, KIT_DIR, KIT10 (path to a kit 1.0.0 tag-arcade-touch.js).
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');
const req = createRequire('C:/Users/soon2/Documents/TAG Wordpress Website/scripts/arcade/package.json');
const { chromium } = req('playwright');

const PLUGIN = process.env.PLUGIN_DIR || 'C:/Users/soon2/Documents/TAG Wordpress Website/tag-arcade/rank-arena/plugin';
const KIT = process.env.KIT_DIR || 'C:/Users/soon2/Documents/TAG Wordpress Website/tag-arcade/_shared/touch-kit';
const KIT10 = process.env.KIT10 || 'C:/Users/soon2/AppData/Local/Temp/claude/c--Users-soon2-Documents-TAG-Wordpress-Website/672e6ee8-8972-415d-8ad3-7b743afecb52/scratchpad/touchfix/orig/tag-arcade-touch.js';
const OUT = process.argv[2] || require('os').tmpdir();
fs.mkdirSync(OUT, { recursive: true });
const html = fs.readFileSync(path.join(PLUGIN, 'dist/index.html'), 'utf8');
const JS = html.match(/assets\/(index-[\w-]+\.js)/)[1];
const CSS = html.match(/assets\/(index-[\w-]+\.css)/)[1];

let fails = 0, passes = 0;
function check(name, ok, extra) {
  if (ok) { passes++; console.log('  ok  ' + name); } else { fails++; console.log('  FAIL ' + name + (extra ? ' :: ' + JSON.stringify(extra) : '')); }
}

const g = (id, t) => ({ id, title: t, year: 2015 + id, genre: ['Action', 'RPG'], cover_url: null });
const CH = {
  date: '2026-10-25', challengeNumber: 218, statCategory: 'metacritic', statLabel: 'Metacritic',
  matchups: [[1, 'Hades', 2, 'Celeste'], [3, 'Hollow Knight', 4, 'Stardew Valley'], [5, 'Disco Elysium', 6, 'Balatro']]
    .map(([a, ta, b, tb]) => ({ game_a: g(a, ta), game_b: g(b, tb) })),
};

function page404(route) { return route.fulfill({ status: 404, body: '' }); }

async function setup(browser, { vp, touch, kit, kit10, reduce }) {
  const ctx = await browser.newContext({
    viewport: vp, hasTouch: touch, isMobile: touch, deviceScaleFactor: 2,
    reducedMotion: reduce ? 'reduce' : 'no-preference',
    userAgent: touch ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' : undefined,
  });
  await ctx.addInitScript(() => {
    window.__track = [];
    // The site analytics hook the kit sends through (GA4 + PostHog on prod).
    window.tagArcadeTrack = (name, params) => { window.__track.push({ name, params }); };
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('http://ra.test/**', async (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname;
    if (p === '/') {
      const kitTags = kit ? `<link rel="stylesheet" href="/kit/tag-arcade-touch.css"><script src="/${kit10 ? 'kit10' : 'kit'}/tag-arcade-touch.js"></script>` : '';
      return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${kitTags}<link rel="stylesheet" href="/a/${CSS}"><style>body{margin:0;background:#0b0f1a;color:#fff;font-family:sans-serif}</style></head><body><header style="height:56px;padding:8px">TAG header</header><h1 style="margin:8px">Rank Arena</h1><div id="rank-arena-root" style="width:100%"></div><article style="height:900px;padding:16px">Article below the game</article><script>window.rankArena={apiUrl:'/wp-json/rank-arena/v1',nonce:'x',siteUrl:'/',userId:0}</script><script type="module" src="/a/${JS}"></script></body></html>` });
    }
    if (p === '/kit10/tag-arcade-touch.js') return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(KIT10) });
    if (p.startsWith('/kit/')) return route.fulfill({ contentType: p.endsWith('.css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(path.join(KIT, p.slice(5))) });
    if (p.startsWith('/a/')) {
      const f = path.join(PLUGIN, 'dist/assets', p.slice(3));
      return route.fulfill({ contentType: p.endsWith('.css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(f) });
    }
    if (p.endsWith('/challenge/today')) return route.fulfill({ json: CH });
    if (p.endsWith('/challenge/submit')) {
      const body = JSON.parse(route.request().postData() || '{}');
      await new Promise((r) => setTimeout(r, 80));
      return route.fulfill({ json: { correct: body.choice === 'a', game_a_stat: 91, game_b_stat: 74, correctAnswer: 'a' } });
    }
    if (p.endsWith('/challenge/result')) return route.fulfill({ json: { saved: true } });
    if (p.includes('/me')) return route.fulfill({ status: 401, json: { message: 'no' } });
    if (p.includes('/leaderboard')) return route.fulfill({ json: { entries: [], total: 0 } });
    return page404(route);
  });
  await page.goto('http://ra.test/');
  await page.waitForSelector('#rank-arena-root .tag-card');
  if (kit) {
    await page.evaluate(() => {
      window.__hap = [];
      const orig = window.tagArcade.haptic;
      window.tagArcade.haptic = function (k) { window.__hap.push(k); return orig.apply(this, arguments); };
      window.__pops = 0;
      const ta = window.tagArcade;
      if (ta.juice && ta.juice.pop) { const op = ta.juice.pop; ta.juice.pop = function () { window.__pops++; return op.apply(this, arguments); }; }
    });
  }
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}

async function cdpSwipe(page, cdp, sel, dy, { holdShot, rest } = {}) {
  const box = await page.locator(sel).boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height * 0.6;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (dy * i) / steps, id: 1 }] });
    await page.waitForTimeout(16);
  }
  if (rest) await page.waitForTimeout(rest); // finger rests before lifting: no fling velocity
  if (holdShot) await page.screenshot({ path: holdShot });
  const state = await page.locator(sel).getAttribute('data-swipe');
  const chip = await page.locator(sel + ' .ra-swipe-chip').textContent().catch(() => null);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  return { state, chip };
}

const cardA = '#rank-arena-root .flex-1:nth-child(1) .tag-card';
const cardB = '#rank-arena-root .flex-1:nth-child(3) .tag-card';
const scoreText = (page) => page.locator('.score-counter').first().textContent();

async function waitIdle(page, round) {
  await page.waitForFunction((r) => {
    const t = [...document.querySelectorAll('#rank-arena-root span')].map((s) => s.textContent).join('|');
    const c = document.querySelector('#rank-arena-root .tag-card');
    return t.includes(`Round ${r} /`) && c && !c.disabled;
  }, round, { timeout: 5000 }).catch(async (e) => { console.log("DEBUG", await page.evaluate(() => [...document.querySelectorAll("#rank-arena-root span")].map((s) => s.textContent).join("|") + " disabled=" + document.querySelector("#rank-arena-root .tag-card").disabled)); throw e; });
}

async function smallTargets(page) {
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll('#rank-arena-root button, #rank-arena-root a, #rank-arena-root [role=button]').forEach((e) => {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') return;
      if (e.tagName === 'A' && cs.display === 'inline') return; // inline text links exempt (WCAG 2.5.8)
      if (r.width < 44 || r.height < 44) out.push({ t: (e.textContent || '').trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) });
    });
    return out;
  });
}

async function touchRun(browser, vp, name, { kit = true, kit10 = false, reduce = false } = {}) {
  console.log(`\n[${name}] ${vp.width}x${vp.height} touch kit=${kit}${kit10 ? ' (1.0.0)' : ''} reduce=${reduce}`);
  const { ctx, page, errors } = await setup(browser, { vp, touch: true, kit, kit10, reduce });
  const kit11 = kit && !kit10;
  const tracked = (n) => page.evaluate((x) => window.__track.filter((e) => e.name === x).map((e) => e.params), n);
  if (kit) check('kit version', (await page.evaluate(() => window.tagArcade.touchKit)) === (kit10 ? '1.0.0' : '1.1.1'));
  const cdp = await ctx.newCDPSession(page);
  const shot = (s) => path.join(OUT, `${name}-${s}.png`);
  await page.locator(cardA).scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.screenshot({ path: shot('1-idle') });
  const tip = await page.locator('.tag-coach-tip').textContent().catch(() => null);
  if (kit11) {
    check('coach shows on a first touch visit (swipe up)', /Swipe a card up/.test(tip || ''), tip);
    check('coach overlay is pointer-events:none', await page.locator('.tag-coach').evaluate((e) => getComputedStyle(e).pointerEvents === 'none'));
  } else {
    check('no coach without kit 1.1', (await page.locator('.tag-coach').count()) === 0);
  }

  check('touch-action:none on cards while a vote is open', (await page.locator(cardA).evaluate((e) => getComputedStyle(e).touchAction)) === 'none');
  if (kit) await page.evaluate(() => window.tagArcade._setInputMode && window.tagArcade._setInputMode('touch'));
  const prompt = await page.locator('.ra-touch-prompt').textContent().catch(() => '');
  if (vp.width < 640) check('mobile bar prompt teaches the swipe', /Swipe a card up/.test(prompt || ''), prompt);

  // 1. swipe A up: votes (A is right)
  const sy = await page.evaluate(() => window.scrollY);
  const s1 = await cdpSwipe(page, cdp, cardA, -140, { holdShot: shot('2-swipe-armed') });
  check('swipe arms past the line', s1.state === 'armed' && /Release to vote/.test(s1.chip || ''), s1);
  await page.waitForFunction(() => document.querySelector('.score-counter')?.textContent.startsWith('1'), null, { timeout: 4000 }).catch(() => {});
  check('swipe up voted (score 1)', (await scoreText(page)).startsWith('1'), await scoreText(page));
  check('swipe did not scroll the page', Math.abs((await page.evaluate(() => window.scrollY)) - sy) < 2);
  if (kit11) {
    check('coach finished by the vote and saved', (await page.locator('.tag-coach').count()) === 0
      && await page.evaluate(() => !!JSON.parse(localStorage.getItem('tag_arcade_coach_v1') || '{}')['rank-arena-v1']));
  }
  await page.waitForTimeout(250);
  await page.screenshot({ path: shot('3-reveal-countup') });
  await page.waitForTimeout(600);
  if (kit) {
    const hap = await page.evaluate(() => window.__hap.slice());
    const ticks = hap.filter((k) => k === 'tick').length;
    check('haptics: heavy on swipe vote, ticks during count-up, ends on success', hap.includes('heavy') && hap[hap.length - 1] === 'success' && (reduce ? ticks <= 2 : ticks >= 5), hap);
  }
  if (kit11) {
    check('correct card popped (juice.pop) as the count-up landed', (await page.evaluate(() => window.__pops)) === 1, await page.evaluate(() => window.__pops));
    const fs1 = await tracked('arcade_first_success_ms');
    check('arcade_first_success_ms once, label first_correct', fs1.length === 1 && fs1[0].label === 'first_correct', fs1);
    check('a finger press ticks (juice.press)', (await page.evaluate(() => window.__hap)).includes('tick'));
  } else if (kit) {
    check('no telemetry on kit 1.0.0', (await tracked('arcade_first_success_ms')).length === 0);
  }
  const statA = await page.locator(cardA).textContent();
  check('stat revealed', /91 \/ 100/.test(statA), statA.slice(-40));

  // 2. a short swipe that is dragged back does not vote; then tap-tap on B (wrong)
  await page.touchscreen.tap(5, 300); // skip the auto-advance wait
  await waitIdle(page, 2);
  const s2 = await cdpSwipe(page, cdp, cardB, -25, { rest: 200 });
  check('short drag does not arm', s2.state !== 'armed', s2);
  await page.waitForTimeout(300);
  check('short drag did not vote', (await scoreText(page)).startsWith('1') && !(await page.locator(cardB).isDisabled()));
  const bb = await page.locator(cardB).boundingBox();
  await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  await page.waitForTimeout(350);
  const hint = await page.locator(cardB + ' .ra-select-hint').textContent().catch(() => '');
  {
    check('first tap selects with "Tap again" hint', /Tap again to lock in/.test(hint), hint);
    check('round not submitted after one tap', !(await page.locator(cardB).isDisabled()));
    await page.screenshot({ path: shot('4-selected-tap-again') });
    if (kit) await page.evaluate(() => { window.__hap.length = 0; });
    await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2);
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: shot('5-wrong-reveal') });
  check('second tap voted (wrong, score stays 1)', (await page.locator(cardB).isDisabled()) && (await scoreText(page)).startsWith('1'));
  if (kit) {
    const hap = await page.evaluate(() => window.__hap.slice());
    check('wrong reveal ends on fail haptic', hap[hap.length - 1] === 'fail', hap);
  }

  // 3. the sticky Confirm bar still works (mobile only)
  await page.touchscreen.tap(5, 300);
  await waitIdle(page, 3);
  if (vp.width < 640) {
    await page.locator('#rank-arena-root .sm\\:hidden button').first().tap();
    await page.waitForTimeout(100);
    const confirm = page.locator('#rank-arena-root button', { hasText: 'CONFIRM PICK' });
    check('sticky Confirm bar shows after a pick', await confirm.isVisible());
    const cb = await confirm.boundingBox();
    check('Confirm is >=56px tall', cb && cb.height >= 56, cb);
    await confirm.tap();
    await page.waitForTimeout(400);
    check('Confirm bar submitted', (await scoreText(page)).startsWith('2'), await scoreText(page));
  }
  await page.waitForTimeout(2200);
  const small = await smallTargets(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  const smallTop = await smallTargets(page);
  check('no interactive target under 44px (game + results)', small.length === 0 && smallTop.length === 0, small.concat(smallTop));
  await page.screenshot({ path: shot('6-end') });
  if (kit11) {
    const rc = await tracked('arcade_round_complete');
    // Under 640px the run finishes via the Confirm bar; wider, round 3 is left open.
    if (vp.width < 640) check('arcade_round_complete once at the end of the daily (explicit, daily, 3 rounds)', rc.length === 1 && rc[0].via === 'explicit' && rc[0].mode === 'daily' && rc[0].rounds === 3, rc);
    else check('no arcade_round_complete while the daily is unfinished', rc.length === 0, rc);
    check('first_success still once; a wrong pick never pops', (await tracked('arcade_first_success_ms')).length === 1);
    await page.reload();
    await page.waitForTimeout(1200);
    check('reload of a finished daily: no coach, no new round_complete', (await page.locator('.tag-coach').count()) === 0 && (await tracked('arcade_round_complete')).length === 0);
  }
  check('no page errors', errors.length === 0, errors);
  await ctx.close();
}

async function desktopRun(browser) {
  console.log('\n[desktop] 1280x800 mouse, kit loaded');
  const { ctx, page, errors } = await setup(browser, { vp: { width: 1280, height: 800 }, touch: false, kit: true });
  check('desktop: no swipe chip, no mobile prompt visible', !(await page.locator('.ra-touch-prompt').isVisible()));
  await page.waitForTimeout(800);
  check('desktop: no coach for mouse players', (await page.locator('.tag-coach').count()) === 0);
  const tabH = await page.locator('#rank-arena-root .ra-tab').first().evaluate((e) => e.getBoundingClientRect().height);
  check('desktop: tabs keep their 32px height', Math.round(tabH) === 32, tabH);
  // mouse drag upward on a card must not vote
  const b = await page.locator(cardA).boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y - 60, { steps: 8 }); // end off the card so no click fires
  check('desktop: mouse drag shows no swipe UI', (await page.locator(cardA + ' .ra-swipe-chip').count()) === 0);
  await page.mouse.up();
  await page.waitForTimeout(300);
  check('desktop: mouse drag off a card does not vote', !(await page.locator(cardA).isDisabled()));
  // single click still submits straight away on desktop
  await waitIdle(page, 1).catch(() => {});
  const before = await scoreText(page);
  await page.locator(cardA).click();
  await page.waitForTimeout(400);
  check('desktop: one click submits (unchanged)', (await page.locator(cardA).isDisabled()), { before, after: await scoreText(page) });
  await page.screenshot({ path: path.join(OUT, 'desktop-reveal.png') });
  // The key that skips the reveal wait must only skip: it used to also vote card A in the next round.
  const next = page.locator('#rank-arena-root button', { hasText: 'Next' });
  const neitherVoted = async () => !(await page.locator(cardA).isDisabled()) && !(await page.locator(cardB).isDisabled());
  await next.waitFor({ timeout: 5000 });
  await page.keyboard.press(' ');
  await waitIdle(page, 2);
  await page.waitForTimeout(400);
  check('desktop: Space that skips the reveal does not vote in the next round', await neitherVoted());
  // keyboard: arrows select, Enter confirms
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(100);
  check('desktop: keyboard select does not submit', !(await page.locator(cardB).isDisabled()));
  check('desktop: no selected-card hint on desktop', (await page.locator(cardB + ' .ra-select-hint').count()) === 0);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  check('desktop: Enter confirms', await page.locator(cardB).isDisabled());
  await next.waitFor({ timeout: 5000 });
  await page.keyboard.press('Enter');
  await waitIdle(page, 3);
  await page.waitForTimeout(400);
  check('desktop: Enter that skips the reveal does not vote in the next round', await neitherVoted());
  check('desktop: no page errors', errors.length === 0, errors);
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    if (process.env.ONLY === 'desktop') { await desktopRun(browser); throw null; }
    await touchRun(browser, { width: 390, height: 844 }, 'p390');
    await touchRun(browser, { width: 844, height: 390 }, 'l844');
    await touchRun(browser, { width: 360, height: 740 }, 'p360');
    await touchRun(browser, { width: 390, height: 844 }, 'nokit390', { kit: false });
    await touchRun(browser, { width: 390, height: 844 }, 'kit10-390', { kit10: true });
    await touchRun(browser, { width: 390, height: 844 }, 'reduce390', { reduce: true });
    await desktopRun(browser);
  } catch (e) { if (e !== null) { fails++; console.error(e); } }
  await browser.close();
  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})();
