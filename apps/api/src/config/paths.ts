import path from 'node:path';
import fs from 'node:fs';

export function resolveMigrationsDir(): string {
  // Probe common locations in the built container
  const candidates = [
    path.resolve(process.cwd(), 'packages/database/drizzle'),
    path.resolve(process.cwd(), 'packages/database/migrations'),
    // Fallback to dist-copy if we later copy assets during build
    path.resolve(process.cwd(), 'dist/packages/database/drizzle'),
    path.resolve(process.cwd(), 'dist/packages/database/migrations'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'meta', '_journal.json'))) {
      return p;
    }
  }

  // Last resort: return first existing dir even if meta is missing (so we can log a clear error)
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  return candidates[0]; // will cause a clear error and log path
}
