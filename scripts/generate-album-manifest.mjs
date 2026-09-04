import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { v2 as cloudinary } from "cloudinary";

const outputPath = resolve("src/data/photoManifest.json");
const roots = new Map([
  ["analog", "Analógicas"],
  ["digital", "Digitales"],
]);

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Cloudinary credentials are required to generate the album manifest.");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const folders = new Set();
const photosByFolder = new Map();
let allPhotos = [];
let nextCursor;

do {
  const search = cloudinary.search
    .expression("resource_type:image")
    .sort_by("public_id", "asc")
    .max_results(500);

  if (nextCursor) search.next_cursor(nextCursor);

  const result = await search.execute();

  for (const resource of result.resources) {
    const segments = resource.public_id.split("/");
    const root = segments[0];

    if (!roots.has(root)) continue;

    const photo = {
      url: resource.secure_url,
      publicId: resource.public_id,
      width: resource.width,
      height: resource.height,
    };

    allPhotos.push(photo);

    if (segments.length === 1) {
      const rootFolder = segments[0];
      if (!photosByFolder.has(rootFolder)) {
        photosByFolder.set(rootFolder, []);
      }
      photosByFolder.get(rootFolder).push(photo);
      continue;
    }

    for (let depth = 1; depth < segments.length; depth += 1) {
      const folder = segments.slice(0, depth).join("/");
      folders.add(folder);

      if (!photosByFolder.has(folder)) {
        photosByFolder.set(folder, []);
      }
      photosByFolder.get(folder).push(photo);
    }
  }

  nextCursor = result.next_cursor;
} while (nextCursor);

const labelForFolder = (folder) => {
  const name = folder.split("/").at(-1) ?? folder;
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const manifest = {
  version: 1,
  roots: [...roots].map(([id, label]) => ({ id, label, folder: id })),
  albums: [...folders]
    .filter((folder) => !roots.has(folder))
    .sort()
    .map((folder) => ({ id: folder, label: labelForFolder(folder), folder })),
  allPhotos,
  photosByFolder: [...folders, ...roots.keys()].reduce(
    (acc, folder) => {
      acc[folder] = photosByFolder.get(folder) ?? [];
      return acc;
    },
    {}
  ),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated photo manifest with ${manifest.albums.length} albums and ${allPhotos.length} photos.`);
