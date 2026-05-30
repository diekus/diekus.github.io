import { readdir } from 'node:fs/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

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

  const knownFilenames = new Set(existing.map(e => e.filename));
  const newFiles = imageFiles.filter(f => !knownFilenames.has(f));

  if (newFiles.length === 0) {
    console.log(`gallery.json is up to date. (${existing.length} ${existing.length === 1 ? 'entry' : 'entries'})`);
    return;
  }

  const stubs = newFiles.map(filename => ({
    filename,
    description: '',
    iso: null,
    aperture: '',
    shutterSpeed: '',
    camera: '',
    focalLength: '',
    location: '',
  }));

  const updated = [...existing, ...stubs];
  writeFileSync(GALLERY_JSON, JSON.stringify(updated, null, 2) + '\n');

  console.log(`Added ${newFiles.length} stub${newFiles.length > 1 ? 's' : ''}:`);
  newFiles.forEach(f => console.log(`  + ${f}`));
  console.log(`gallery.json now has ${updated.length} ${updated.length === 1 ? 'entry' : 'entries'}.`);
}

main();
