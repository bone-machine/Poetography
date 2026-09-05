import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const manifestPath = resolve("src/data/photoManifest.json");

function validatePhoto(photo) {
  if (typeof photo !== "object" || photo === null) {
    return { valid: false, error: "Photo is not an object" };
  }

  if (typeof photo.url !== "string" || !photo.url) {
    return { valid: false, error: `Photo missing valid url: ${JSON.stringify(photo)}` };
  }

  if (typeof photo.publicId !== "string" || !photo.publicId) {
    return { valid: false, error: `Photo missing valid publicId: ${JSON.stringify(photo)}` };
  }

  if (typeof photo.width !== "number" || !Number.isFinite(photo.width) || photo.width <= 0) {
    return { valid: false, error: `Photo has invalid width: ${JSON.stringify(photo)}` };
  }

  if (typeof photo.height !== "number" || !Number.isFinite(photo.height) || photo.height <= 0) {
    return { valid: false, error: `Photo has invalid height: ${JSON.stringify(photo)}` };
  }

  return { valid: true };
}

function validateAlbum(album, type) {
  if (typeof album !== "object" || album === null) {
    return { valid: false, error: `${type} is not an object` };
  }

  if (typeof album.id !== "string" || !album.id) {
    return { valid: false, error: `${type} missing valid id: ${JSON.stringify(album)}` };
  }

  if (typeof album.label !== "string" || !album.label) {
    return { valid: false, error: `${type} missing valid label: ${JSON.stringify(album)}` };
  }

  if (typeof album.folder !== "string" || !album.folder) {
    return { valid: false, error: `${type} missing valid folder: ${JSON.stringify(album)}` };
  }

  return { valid: true };
}

async function validateManifest() {
  let manifest;

  try {
    const content = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(content);
  } catch (error) {
    console.error("❌ Failed to read or parse photo manifest:");
    console.error(error.message);
    process.exit(1);
  }

  const errors = [];

  // Validate version
  if (typeof manifest.version !== "number") {
    errors.push("Manifest missing valid 'version' field (expected number)");
  }

  // Validate roots
  if (!Array.isArray(manifest.roots)) {
    errors.push("Manifest missing 'roots' array");
  } else {
    for (let i = 0; i < manifest.roots.length; i++) {
      const result = validateAlbum(manifest.roots[i], `Root[${i}]`);
      if (!result.valid) errors.push(result.error);
    }
  }

  // Validate albums
  if (!Array.isArray(manifest.albums)) {
    errors.push("Manifest missing 'albums' array");
  } else {
    for (let i = 0; i < manifest.albums.length; i++) {
      const result = validateAlbum(manifest.albums[i], `Album[${i}]`);
      if (!result.valid) errors.push(result.error);
    }
  }

  // Validate photosByFolder
  if (typeof manifest.photosByFolder !== "object" || manifest.photosByFolder === null) {
    errors.push("Manifest missing 'photosByFolder' object");
  } else {
    for (const [folder, photos] of Object.entries(manifest.photosByFolder)) {
      if (!Array.isArray(photos)) {
        errors.push(`photosByFolder['${folder}'] is not an array`);
        continue;
      }

      const seenPublicIds = new Set();
      for (let i = 0; i < photos.length; i++) {
        const result = validatePhoto(photos[i]);
        if (!result.valid) {
          errors.push(`photosByFolder['${folder}'][${i}]: ${result.error}`);
          continue;
        }

        const publicId = photos[i].publicId;
        if (seenPublicIds.has(publicId)) {
          errors.push(`photosByFolder['${folder}'][${i}]: duplicate publicId '${publicId}' within folder`);
          continue;
        }
        seenPublicIds.add(publicId);
      }
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error("❌ Photo manifest validation failed:\n");
    errors.forEach((error) => console.error(`  • ${error}`));
    console.error(`\n${errors.length} validation error(s) found.`);
    process.exit(1);
  }

  // Check for cross-folder duplicate publicIds
  const allPublicIds = new Set();
  for (const [folder, photos] of Object.entries(manifest.photosByFolder || {})) {
    if (!Array.isArray(photos)) continue;
    for (const photo of photos) {
      const publicId = photo.publicId;
      if (allPublicIds.has(publicId)) {
        errors.push(`Duplicate publicId '${publicId}' found in multiple folders (first seen in an earlier folder)`);
      }
      allPublicIds.add(publicId);
    }
  }

  const totalPhotos = Object.values(manifest.photosByFolder || {})
    .reduce((sum, photos) => sum + (Array.isArray(photos) ? photos.length : 0), 0);

  console.log("✅ Photo manifest is valid");
  console.log(`   - ${manifest.roots?.length || 0} roots`);
  console.log(`   - ${manifest.albums?.length || 0} albums`);
  console.log(`   - ${totalPhotos} total photos across ${Object.keys(manifest.photosByFolder || {}).length} leaf folders`);
}

validateManifest();
