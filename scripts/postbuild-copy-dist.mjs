#!/usr/bin/env node
// Copy the freshly built dist/ into the TAG-rank-arena plugin workspace so a
// single `npm run build` produces a ready-to-deploy WordPress plugin tree.
//
// Source of truth split:
//   - This repo (Yoshyaes/Rank-arena) holds React + Node server source.
//   - Yoshyaes/TAG-rank-arena holds the WP plugin (PHP + dist/) plus the
//     TAG Arcade integration in rank-arena.php.
//
// Target resolution order:
//   1. process.env.TAG_RANK_ARENA_PLUGIN_DIR (absolute or repo-relative)
//   2. Sibling default: ../TAG Wordpress Website/plugins/rank-arena
//      (matches Fred's machine; will fail loudly elsewhere so people notice)
//
// The script wipes <target>/dist/ before copying so stale assets never leak
// through.

import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const sourceDist = join(repoRoot, 'dist');

const targetOverride = process.env.TAG_RANK_ARENA_PLUGIN_DIR;
const targetPluginDir = targetOverride
  ? resolve(targetOverride)
  : resolve(repoRoot, '..', 'TAG Wordpress Website', 'plugins', 'rank-arena');
const targetDist = join(targetPluginDir, 'dist');

if (!existsSync(sourceDist)) {
  console.error(`postbuild: no dist/ at ${sourceDist}. Did vite build succeed?`);
  process.exit(1);
}

if (!existsSync(targetPluginDir)) {
  console.error(`postbuild: target plugin dir does not exist: ${targetPluginDir}`);
  console.error(
    targetOverride
      ? '  (TAG_RANK_ARENA_PLUGIN_DIR points there but the dir is missing.)'
      : '  Set TAG_RANK_ARENA_PLUGIN_DIR to the absolute path of your TAG-rank-arena checkout.'
  );
  process.exit(1);
}

rmSync(targetDist, { recursive: true, force: true });
mkdirSync(targetDist, { recursive: true });
cpSync(sourceDist, targetDist, { recursive: true });

console.log(`postbuild: copied dist -> ${targetDist}`);
