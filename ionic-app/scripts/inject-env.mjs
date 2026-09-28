#!/usr/bin/env node
// Generates src/environments/environment.local.ts from environment variables,
// so the "local" Angular configuration (angular.json) can fileReplace
// environment.ts with real Supabase credentials without ever committing them.
//
// Local dev: values come from ionic-app/.env.local (gitignored), loaded here
// via `dotenv`. CAP-8 (Vercel/deploy) can reuse this same script unchanged --
// dotenv.config() only supplements process.env, it never overrides variables
// already set by the platform, so on Vercel (which injects SUPABASE_URL /
// SUPABASE_ANON_KEY natively, no .env.local file on disk) this just no-ops
// on the missing file and reads process.env directly.
//
// Never throws: if .env.local is missing or a variable is unset, the
// generated file falls back to the same empty-string placeholders that
// environment.ts already ships, and SupabaseService's existing null-fallback
// (client = null) takes over from there. This script must never break the
// build.

import { config as loadDotenv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Soft-load .env.local: does nothing (no throw) if the file doesn't exist --
// e.g. on Vercel, where env vars are already in process.env.
loadDotenv({ path: join(projectRoot, '.env.local') });

const supabaseUrl = process.env['SUPABASE_URL'] ?? '';
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] ?? '';

// npm sets `npm_lifecycle_event` to the name of the script currently running.
// `prebuild` (npm run build -> production, the config Vercel/CAP-8 uses) means
// a real production build; `prestart` (npm start -> ng serve --configuration
// local) means local dev. This is the only build-target signal available to
// this script, since it runs before Angular CLI applies fileReplacements.
const isProductionBuild = process.env['npm_lifecycle_event'] === 'prebuild';

const outputPath = join(projectRoot, 'src/environments/environment.local.ts');

// Escape backslashes and single quotes so the interpolated values can't break
// out of the single-quoted string literals below.
const escapeForSingleQuotedString = (value) =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const contents = `// GENERATED FILE -- do not edit by hand.
// Produced by scripts/inject-env.mjs from SUPABASE_URL / SUPABASE_ANON_KEY
// (ionic-app/.env.local locally, or the platform's env vars in CI/deploy).
// Gitignored: see ionic-app/.gitignore.

export const environment = {
  production: ${isProductionBuild},
  supabaseUrl: '${escapeForSingleQuotedString(supabaseUrl)}',
  supabaseAnonKey: '${escapeForSingleQuotedString(supabaseAnonKey)}',
};
`;

try {
  writeFileSync(outputPath, contents, 'utf8');
} catch (err) {
  console.warn(
    `[inject-env] Failed to write environment.local.ts -- continuing without it: ${err.message}`,
  );
  process.exit(0);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[inject-env] SUPABASE_URL / SUPABASE_ANON_KEY not set -- environment.local.ts written with empty placeholders (SupabaseService.client will be null).',
  );
} else {
  console.log('[inject-env] environment.local.ts written with real Supabase credentials.');
}
