import { useEffect, useState, useMemo } from "react";
import { fetchPhotos } from "../utils/fetchPhotos";
import type { Photo } from "../types/photo";

export function usePhotos(photosFolderName: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const CACHE_KEY = "poetographyCache_v1";
    const TTL_MS = 1000 * 60 * 30; // 30 minutes

    const loadPhotos = async () => {
      try {
        const cachedPhotos = localStorage.getItem(CACHE_KEY);
        if (cachedPhotos) {
          const { timestamp, data } = JSON.parse(cachedPhotos);
          const isCacheFresh = Date.now() - timestamp < TTL_MS;

          if (Array.isArray(data)) {
            setPhotos(data);
            setLoading(false);

            if (isCacheFresh) {
              return;
            }
          }
        }
        const data = await fetchPhotos();
        setPhotos(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, []);

  const filteredPhotos = useMemo(
    () =>
      photosFolderName === null
        ? photos
        : photos.filter((photo) => photo.publicId.startsWith(`${photosFolderName}/`)),
    [photosFolderName, photos],
  );

  return { loading, filteredPhotos, photos };
}
