import type { Photo } from "../types/photo";

export type PhotosPage = {
  photos: Photo[];
  nextCursor: string | null;
};

export async function fetchPhotos(
  photosFolderName?: string,
  cursor?: string | null,
): Promise<PhotosPage> {
  const params = new URLSearchParams();
  if (photosFolderName) params.set("photosFolderName", photosFolderName);
  if (cursor) params.set("cursor", cursor);

  const query = params.toString();
  const url = query
    ? `/.netlify/functions/photosHandler?${query}`
    : "/.netlify/functions/photosHandler";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch photos");
  return (await res.json()) as PhotosPage;
}
