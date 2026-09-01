import { useCallback, useEffect, useRef, useState } from "react";

import type { Photo } from "../types/photo";
import { fetchPhotos, PhotosFetchError, type PhotosPage } from "../utils/fetchPhotos";

const CACHE_VERSION = 6;
const CACHE_TTL_MS = 1000 * 60 * 60;
const MAX_PAGINATION_RETRIES = 2;
const PAGINATION_RETRY_DELAYS_MS = [500, 1500];

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

function isRetryableError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") return false;

  if (error instanceof PhotosFetchError) {
    return error.status === 408 || error.status === 429 || error.status >= 500;
  }

  return true;
}

function waitForRetry(delayMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, delayMs);

    const handleAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException("Request aborted", "AbortError"));
    };

    signal.addEventListener("abort", handleAbort, { once: true });

    if (signal.aborted) handleAbort();
  });
}

export function usePhotos(photosFolderName: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [paginationRetryAvailable, setPaginationRetryAvailable] = useState(false);
  const loadingMoreRef = useRef(false);
  const photosRef = useRef<Photo[]>([]);
  const requestIdRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    activeControllerRef.current?.abort();

    const controller = new AbortController();
    activeControllerRef.current = controller;
    let isMounted = true;
    loadingMoreRef.current = false;

    const loadFirstPage = async () => {
      await Promise.resolve();
      if (!isMounted || requestId !== requestIdRef.current) return;

      setPhotos([]);
      photosRef.current = [];
      setNextCursor(null);
      setLoading(true);
      setError(null);
      setPaginationRetryAvailable(false);

      const cacheKey = getCacheKey(photosFolderName);

      try {
        const cachedPhotos = localStorage.getItem(cacheKey);

        if (cachedPhotos) {
          const parsedCache: unknown = JSON.parse(cachedPhotos);

          if (isPhotoCache(parsedCache)) {
            if (isMounted && requestId === requestIdRef.current) {
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
        const page = await fetchPhotos(photosFolderName ?? undefined, undefined, controller.signal);

        if (isMounted && requestId === requestIdRef.current) {
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
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cache));
        } catch (cacheError) {
          console.warn("Unable to cache photos", cacheError);
        }
      } catch (fetchError) {
        if (controller.signal.aborted || !isMounted || requestId !== requestIdRef.current) return;

        console.error(fetchError);

        setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch photos");
        setLoading(false);
      }
    };

    loadFirstPage();

    return () => {
      isMounted = false;
      controller.abort();
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    };
  }, [photosFolderName, retryCount]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMoreRef.current) return;

    const requestId = requestIdRef.current;
    const controller = new AbortController();
    activeControllerRef.current?.abort();
    activeControllerRef.current = controller;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setPaginationRetryAvailable(false);

    try {
      let page: PhotosPage | undefined;

      for (let attempt = 0; attempt <= MAX_PAGINATION_RETRIES; attempt += 1) {
        try {
          page = await fetchPhotos(photosFolderName ?? undefined, nextCursor, controller.signal);
          break;
        } catch (fetchError) {
          if (
            controller.signal.aborted ||
            requestId !== requestIdRef.current ||
            !isRetryableError(fetchError) ||
            attempt === MAX_PAGINATION_RETRIES
          ) {
            throw fetchError;
          }

          await waitForRetry(PAGINATION_RETRY_DELAYS_MS[attempt], controller.signal);
        }
      }

      if (!page || controller.signal.aborted || requestId !== requestIdRef.current) return;

      const nextPhotos = [...photosRef.current, ...page.photos];
      photosRef.current = nextPhotos;
      setPhotos(nextPhotos);
      setNextCursor(page.nextCursor);
      setPaginationRetryAvailable(false);

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
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current ||
        !isRetryableError(fetchError)
      ) {
        return;
      }

      console.error(fetchError);
      setPaginationRetryAvailable(true);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
      if (activeControllerRef.current === controller) activeControllerRef.current = null;
    }
  }, [nextCursor, photosFolderName]);

  const retry = useCallback(() => setRetryCount((count) => count + 1), []);
  const retryLoadMore = useCallback(() => {
    setPaginationRetryAvailable(false);
    void loadMore();
  }, [loadMore]);

  return {
    loading,
    loadingMore,
    hasMore: nextCursor !== null,
    photos,
    error,
    loadMore,
    retry,
    paginationRetryAvailable,
    retryLoadMore,
  };
}
