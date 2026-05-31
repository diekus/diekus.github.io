import { readdir, stat } from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const GALLERY_DIR = 'images/gallery';
const GALLERY_JSON = 'gallery.json';
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.webp', '.png']);

async function main() {
  let files;
  try {
    files = await readdir(GALLERY_DIR);
  } catch {
    console.error(`Cannot read directory: ${GALLERY_DIR}`);
    process.exit(1);
  }

  const imageFiles = files.filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()));

  let existing = [];
  try {
    existing = JSON.parse(readFileSync(GALLERY_JSON, 'utf8'));
  } catch {
    console.log(`No ${GALLERY_JSON} found — creating a new one.`);
  }

  // Backfill addedAt for any existing entry that doesn't have it yet,
  // using file mtime as a proxy for the first migration run.
  const mtimes = new Map();
  await Promise.all(imageFiles.map(async f => {
    try {
      const s = await stat(join(GALLERY_DIR, f));
      mtimes.set(f, s.mtimeMs);
    } catch {
      mtimes.set(f, 0);
    }
  }));

  const existingWithDates = existing.map(e => ({
    ...e,
    addedAt: e.addedAt ?? new Date(mtimes.get(e.filename) ?? 0).toISOString(),
  }));

  const knownFilenames = new Set(existing.map(e => e.filename));
  const newFiles = imageFiles.filter(f => !knownFilenames.has(f));

  const now = new Date().toISOString();
  const stubs = newFiles.map(filename => ({
    filename,
    description: '',
    iso: null,
    aperture: '',
    shutterSpeed: '',
    camera: '',
    focalLength: '',
    location: '',
    addedAt: now,
  }));

  // Merge and sort newest-first by addedAt
  const updated = [...existingWithDates, ...stubs].sort(
    (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
  );

  const orderChanged = existing.some((e, i) => e.filename !== updated[i]?.filename);
  const datesBackfilled = existingWithDates.some((e, i) => !existing[i]?.addedAt);

  if (newFiles.length === 0 && !orderChanged && !datesBackfilled) {
    console.log(`gallery.json is up to date. (${existing.length} ${existing.length === 1 ? 'entry' : 'entries'})`);
    return;
  }

  writeFileSync(GALLERY_JSON, JSON.stringify(updated, null, 2) + '\n');

  if (newFiles.length > 0) {
    console.log(`Added ${newFiles.length} stub${newFiles.length > 1 ? 's' : ''}:`);
    newFiles.forEach(f => console.log(`  + ${f}`));
  }
  if (datesBackfilled) console.log('Backfilled addedAt for existing entries.');
  if (orderChanged)    console.log('Re-sorted by addedAt (newest first).');
  console.log(`gallery.json now has ${updated.length} ${updated.length === 1 ? 'entry' : 'entries'}.`);
}

main();
