export async function fetchPhotos(folder?: string): Promise<string[]> {
  const url = folder
    ? `/.netlify/functions/photosHandler?folder=${encodeURIComponent(folder)}`
    : '/.netlify/functions/photosHandler';  // Fetch all photos
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch photos');
  return res.json();
}