import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { v2 as cloudinary } from "cloudinary";

const manifestPath = resolve("src/data/photoManifest.json");

try {
  loadEnvFile(".env");
} catch {
  // Netlify provides build environment variables directly.
}

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary credentials are required to generate the photo manifest.");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const resources = [];
let nextCursor;

do {
  const searchResult = await cloudinary.search
    .expression("resource_type:image")
    .sort_by("public_id", "asc")
    .max_results(500)
    .next_cursor(nextCursor)
    .execute();

  resources.push(...searchResult.resources);
  nextCursor = searchResult.next_cursor;
} while (nextCursor);

const photos = resources.map((resource) => ({
  url: resource.secure_url,
  publicId: resource.public_id,
  width: resource.width,
  height: resource.height,
}));

await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(manifestPath, `${JSON.stringify(photos, null, 2)}\n`);

console.log(`Generated photo manifest with ${photos.length} photos.`);
