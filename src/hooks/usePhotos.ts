import type { Photo } from "../types/photo";
import { useEffect, useMemo, useState } from "react";
import { fetchPhotos } from "../utils/fetchPhotos";

const CACHE_KEY = "poetographyCache_v1";
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

type PhotoCache = {
  version: number;
  timestamp: number;
  data: Photo[];
};

function isPhoto(value: unknown): value is Photo {
  if (typeof value !== "object" || value === null) return false;

  const photo = value as Record<string, unknown>;

  return (
    typeof photo.url === "string" &&
    typeof photo.publicId === "string" &&
    typeof photo.width === "number" &&
    Number.isFinite(photo.width) &&
    typeof photo.height === "number" &&
    Number.isFinite(photo.height)
  );
}

function isPhotoCache(value: unknown): value is PhotoCache {
  if (typeof value !== "object" || value === null) return false;

  const cache = value as Record<string, unknown>;

  return (
    cache.version === CACHE_VERSION &&
    typeof cache.timestamp === "number" &&
    Number.isFinite(cache.timestamp) &&
    cache.timestamp >= 0 &&
    Array.isArray(cache.data) &&
    cache.data.every(isPhoto)
  );
}

export function usePhotos(photosFolderName: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPhotos = async () => {
      try {
        const cachedPhotos = localStorage.getItem(CACHE_KEY);

        if (cachedPhotos) {
          const parsedCache: unknown = JSON.parse(cachedPhotos);

          if (isPhotoCache(parsedCache)) {
            if (isMounted) {
              setPhotos(parsedCache.data);
              setLoading(false);
            }

            const now = Date.now();
            const isFreshCache =
              parsedCache.timestamp <= now && now - parsedCache.timestamp < CACHE_TTL_MS;

            if (isFreshCache) return;
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        }
      } catch (cacheError) {
        console.warn("Unable to read cached photos", cacheError);

        try {
          localStorage.removeItem(CACHE_KEY);
        } catch {
          // Storage may be unavailable or read-only in some browser contexts.
        }
      }

      try {
        const data = await fetchPhotos();

        if (isMounted) {
          setPhotos(data);
          setError(null);
        }

        try {
          const cache: PhotoCache = {
            version: CACHE_VERSION,
            timestamp: Date.now(),
            data,
          };

          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (cacheError) {
          console.warn("Unable to cache photos", cacheError);
        }
      } catch (fetchError) {
        console.error(fetchError);

        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch photos");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPhotos();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPhotos = useMemo(
    () =>
      photosFolderName === null
        ? photos
        : photos.filter((photo) => photo.publicId.startsWith(`${photosFolderName}/`)),
    [photosFolderName, photos],
  );

  return { loading, filteredPhotos, error };
}
