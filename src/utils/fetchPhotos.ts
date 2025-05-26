export async function fetchPhotos(photosFolderName?: string): Promise<string[]> {
  const url = photosFolderName
    ? `/.netlify/functions/photosHandler?folder=${encodeURIComponent(photosFolderName)}`
    : '/.netlify/functions/photosHandler';  // Fetch all photos
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch photos');
  return res.json();
}