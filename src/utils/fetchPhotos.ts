import type { Photo } from "../types/photo";

export type PhotosPage = {
  photos: Photo[];
  nextCursor: string | null;
};

export class PhotosFetchError extends Error {
  status: number;

  constructor(status: number) {
    super(`Failed to fetch photos (${status})`);
    this.name = "PhotosFetchError";
    this.status = status;
  }
}

export async function fetchPhotos(
  photosFolderName?: string,
  cursor?: string | null,
  signal?: AbortSignal,
): Promise<PhotosPage> {
  const params = new URLSearchParams();
  if (photosFolderName) params.set("photosFolderName", photosFolderName);
  if (cursor) params.set("cursor", cursor);

  const query = params.toString();
  const url = query
    ? `/.netlify/functions/photosHandler?${query}`
    : "/.netlify/functions/photosHandler";
  const res = await fetch(url, { signal });
  if (!res.ok) throw new PhotosFetchError(res.status);
  return (await res.json()) as PhotosPage;
}
