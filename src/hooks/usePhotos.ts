import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import albumManifest from "../data/photoManifest.json";
import type { Photo } from "../types/photo";
import type { AlbumManifest } from "../types/album";

const PAGE_SIZE = 12;

type ExposedPhotos = {
  photos: Photo[];
  hasMore: boolean;
};

function validatePhoto(value: unknown): value is Photo {
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

function validateManifest(value: unknown): value is AlbumManifest {
  if (typeof value !== "object" || value === null) return false;

  const manifest = value as Record<string, unknown>;

  if (typeof manifest.version !== "number") return false;

  const roots = manifest.roots;
  if (!Array.isArray(roots)) return false;

  for (const root of roots) {
    if (
      typeof root.id !== "string" ||
      typeof root.label !== "string" ||
      typeof root.folder !== "string"
    ) {
      return false;
    }
  }

  const albums = manifest.albums;
  if (!Array.isArray(albums)) return false;

  for (const album of albums) {
    if (
      typeof album.id !== "string" ||
      typeof album.label !== "string" ||
      typeof album.folder !== "string"
    ) {
      return false;
    }
  }

  const allPhotos = manifest.allPhotos;
  if (!Array.isArray(allPhotos) || !allPhotos.every(validatePhoto)) return false;

  const photosByFolder = manifest.photosByFolder;
  if (typeof photosByFolder !== "object" || photosByFolder === null) return false;

  for (const folder of Object.keys(photosByFolder)) {
    const photos = (photosByFolder as Record<string, unknown>)[folder];
    if (!Array.isArray(photos) || !photos.every(validatePhoto)) return false;
  }

  return true;
}

function getPhotosForFolder(manifest: AlbumManifest, photosFolderName: string | null): Photo[] {
  if (photosFolderName === null) {
    return manifest.allPhotos;
  }

  return manifest.photosByFolder[photosFolderName] ?? [];
}

const manifestValid = validateManifest(albumManifest);

export function usePhotos(photosFolderName: string | null) {
  const [exposed, setExposed] = useState<ExposedPhotos>(() => ({
    photos: [],
    hasMore: false,
  }));
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paginationRetryAvailable, setPaginationRetryAvailable] = useState(false);

  const photosRef = useRef<Photo[]>([]);
  const exposedEndRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++activeRequestIdRef.current;
    let isMounted = true;
    loadingMoreRef.current = false;

    const populate = () => {
      if (!isMounted || requestId !== activeRequestIdRef.current) return;

      if (!manifestValid) {
        setLoading(false);
        return;
      }

      const allPhotos = getPhotosForFolder(albumManifest, photosFolderName);

      photosRef.current = allPhotos;
      exposedEndRef.current = Math.min(allPhotos.length, PAGE_SIZE);

      setExposed({
        photos: allPhotos.slice(0, exposedEndRef.current),
        hasMore: allPhotos.length > PAGE_SIZE,
      });
      setLoading(false);
      setPaginationRetryAvailable(false);
    };

    queueMicrotask(populate);

    return () => {
      isMounted = false;
    };
  }, [photosFolderName]);

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    if (!manifestValid) return;

    const hasMore = exposedEndRef.current < photosRef.current.length;
    if (!hasMore) return;

    loadingMoreRef.current = true;

    // Guarantee the loading skeleton renders before pagination updates
    flushSync(() => {
      setLoadingMore(true);
    });

    const nextEnd = Math.min(photosRef.current.length, exposedEndRef.current + PAGE_SIZE);

    exposedEndRef.current = nextEnd;

    setExposed({
      photos: photosRef.current.slice(0, nextEnd),
      hasMore: nextEnd < photosRef.current.length,
    });

    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, []);

  const retryLoadMore = useCallback(() => {
    setPaginationRetryAvailable(false);
    void loadMore();
  }, [loadMore]);

  return {
    loading,
    loadingMore,
    hasMore: exposed.hasMore,
    photos: exposed.photos,
    error: !manifestValid ? "Failed to load photos" : null,
    loadMore,
    paginationRetryAvailable,
    retryLoadMore,
  };
}
