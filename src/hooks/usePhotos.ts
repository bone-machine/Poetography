import { useCallback, useEffect, useRef, useState } from "react";

import type { Photo } from "../types/photo";
import { fetchPhotos } from "../utils/fetchPhotos";

const CACHE_VERSION = 6;
const CACHE_TTL_MS = 1000 * 60 * 60;

type PhotoCache = {
  version: number;
  timestamp: number;
  data: Photo[];
  nextCursor: string | null;
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
    cache.data.every(isPhoto) &&
    (typeof cache.nextCursor === "string" || cache.nextCursor === null)
  );
}

function getCacheKey(photosFolderName: string | null) {
  return `poetographyCache_v${CACHE_VERSION}_${photosFolderName ?? "all"}`;
}

export function usePhotos(photosFolderName: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const loadingMoreRef = useRef(false);
  const photosRef = useRef<Photo[]>([]);

  useEffect(() => {
    let isMounted = true;
    loadingMoreRef.current = false;

    const loadFirstPage = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setPhotos([]);
      photosRef.current = [];
      setNextCursor(null);
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey(photosFolderName);

      try {
        const cachedPhotos = localStorage.getItem(cacheKey);

        if (cachedPhotos) {
          const parsedCache: unknown = JSON.parse(cachedPhotos);

          if (isPhotoCache(parsedCache)) {
            if (isMounted) {
              setPhotos(parsedCache.data);
              photosRef.current = parsedCache.data;
              setNextCursor(parsedCache.nextCursor);
              setLoading(false);
            }

            const isFreshCache = Date.now() - parsedCache.timestamp < CACHE_TTL_MS;
            if (isFreshCache) return;
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (cacheError) {
        console.warn("Unable to read cached photos", cacheError);
      }

      try {
        const page = await fetchPhotos(photosFolderName ?? undefined);

        if (isMounted) {
          setPhotos(page.photos);
          photosRef.current = page.photos;
          setNextCursor(page.nextCursor);
          setError(null);
          setLoading(false);
        }

        const cache: PhotoCache = {
          version: CACHE_VERSION,
          timestamp: Date.now(),
          data: page.photos,
          nextCursor: page.nextCursor,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      } catch (fetchError) {
        console.error(fetchError);

        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch photos");
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      isMounted = false;
    };
  }, [photosFolderName, retryCount]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const page = await fetchPhotos(photosFolderName ?? undefined, nextCursor);
      const nextPhotos = [...photosRef.current, ...page.photos];
      photosRef.current = nextPhotos;
      setPhotos(nextPhotos);
      setNextCursor(page.nextCursor);

      const cache: PhotoCache = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: nextPhotos,
        nextCursor: page.nextCursor,
      };
      try {
        localStorage.setItem(getCacheKey(photosFolderName), JSON.stringify(cache));
      } catch (cacheError) {
        console.warn("Unable to cache more photos", cacheError);
      }
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch more photos");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [nextCursor, photosFolderName]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);

  return { loading, loadingMore, hasMore: nextCursor !== null, photos, error, loadMore, retry };
}
