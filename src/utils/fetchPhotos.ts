import type { Photo } from "../types/photo";

export async function fetchPhotos(photosFolderName?: string): Promise<Photo[]> {
  const url = photosFolderName
    ? `/.netlify/functions/photosHandler?photosFolderName=${encodeURIComponent(photosFolderName)}`
    : "/.netlify/functions/photosHandler"; // Fetch all photos
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch photos");
  return (await res.json()) as Photo[];
}
