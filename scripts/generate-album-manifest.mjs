import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { v2 as cloudinary } from "cloudinary";const outputPath = resolve("src/data/photoManifest.json");

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary credentials are required to generate the album manifest.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Track discovered folder structure
const rootFolders = new Set();
const nestedFolders = new Set();
const leafFolders = new Map(); // folderPath -> photos (only leaf folders, no parent aggregation)
let nextCursor;

// Fetch all images from Cloudinary
do {
  const search = cloudinary.search
    .expression("resource_type:image")
    .sort_by("public_id", "asc")
    .max_results(500);

  if (nextCursor) search.next_cursor(nextCursor);

  const result = await search.execute();

  for (const resource of result.resources) {
    const segments = resource.public_id.split("/");

    // Skip if photo has no folder structure
    if (segments.length < 2) continue;

    const root = segments[0];
    rootFolders.add(root);

    const photo = {
      url: resource.secure_url,
      publicId: resource.public_id,
      width: resource.width,
      height: resource.height,
    };

    // Determine the leaf folder for this photo
    // Photos directly in a root (e.g., digital/photo.jpg) belong to the root folder
    // Photos in nested folders (e.g., analog/odyssey/photo.jpg) belong to the nested folder
    const leafFolder = segments.length === 2
      ? root  // Direct child of root
      : segments.slice(0, -1).join("/");  // Nested folder path

    if (!leafFolders.has(leafFolder)) {
      leafFolders.set(leafFolder, []);
    }
    leafFolders.get(leafFolder).push(photo);

    // Track nested folders (only if depth > 2 segments, i.e., has a parent beyond root)
    if (segments.length > 2) {
      nestedFolders.add(leafFolder);
    }
  }

  nextCursor = result.next_cursor;
} while (nextCursor);

// Helper to humanize folder names
const humanizeLabel = (name) => {
  return name
    .split("/")
    .at(-1)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

// Build manifest with only leaf folders (no parent aggregation, no allPhotos)
const manifest = {
  version: 1,
  roots: [...rootFolders]
    .sort()
    .map((folder) => ({ 
      id: folder, 
      label: humanizeLabel(folder), 
      folder 
    })),
  albums: [...nestedFolders]
    .sort()
    .map((folder) => ({ 
      id: folder, 
      label: humanizeLabel(folder), 
      folder 
    })),
  // Only leaf folders — no parent-child duplication, no allPhotos redundancy.
  // "Todas" (All) view: Object.values(photosByFolder).flat()
  // Root folder view: filter by prefix (e.g., folder.startsWith('analog/'))
  // Specific album: direct lookup
  photosByFolder: [...leafFolders.keys()]
    .sort()
    .reduce((acc, folder) => {
      acc[folder] = leafFolders.get(folder);
      return acc;
    }, {}),
};

const totalPhotos = [...leafFolders.values()].reduce((sum, photos) => sum + photos.length, 0);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated photo manifest with ${manifest.roots.length} roots, ${manifest.albums.length} nested albums, ${totalPhotos} photos across ${Object.keys(manifest.photosByFolder).length} leaf folders.`);
