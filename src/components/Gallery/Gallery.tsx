import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import Lightbox from "../Lightbox/Lightbox";
import poemsData from "../../data/poems.json";
import type { Photo } from "../../types/photo";
import type { Poems } from "../../types/poem";
import { prefetchLightboxPhoto } from "../../utils/prefetchImage";

import GalleryPhoto from "./GalleryPhoto";
import styles from "./Gallery.module.css";

const poems = poemsData as Poems;
const PAGE_SIZE = 12;

type GalleryProps = {
  galleryPhotos: Photo[];
  isLoadingMetadata: boolean;
  isLoadingMore: boolean;
  hasMorePhotos: boolean;
  onLoadMore: () => void;
  error: string | null;
  paginationRetryAvailable: boolean;
  onRetryLoadMore: () => void;
  photosFolderName: string | null;
};

const Gallery = ({
  galleryPhotos,
  isLoadingMetadata,
  isLoadingMore,
  hasMorePhotos,
  onLoadMore,
  error,
  paginationRetryAvailable,
  onRetryLoadMore,
  photosFolderName,
}: GalleryProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedPublicId, setSelectedPublicId] = useState<string | null>(null);
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Set<string>>(() => new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = selectedPublicId
    ? galleryPhotos.findIndex((photo) => photo.publicId === selectedPublicId)
    : -1;

  const handlePhotoLoad = useCallback((publicId: string) => {
    setLoadedPhotoIds((loadedIds) => {
      if (loadedIds.has(publicId)) return loadedIds;

      const nextLoadedIds = new Set(loadedIds);
      nextLoadedIds.add(publicId);
      return nextLoadedIds;
    });
  }, []);

  const handlePhotoError = useCallback((publicId: string) => {
    setLoadedPhotoIds((loadedIds) => {
      if (!loadedIds.has(publicId)) return loadedIds;

      const nextLoadedIds = new Set(loadedIds);
      nextLoadedIds.delete(publicId);
      return nextLoadedIds;
    });
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (
      !sentinel ||
      !scrollContainer ||
      !hasMorePhotos ||
      isLoadingMore ||
      paginationRetryAvailable
    )
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { root: scrollContainer, rootMargin: "0px 0px 400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [galleryPhotos.length, hasMorePhotos, isLoadingMore, onLoadMore, paginationRetryAvailable]);

  const galleryKey = photosFolderName ?? "all-photos";

  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={galleryKey}
          className={styles["gallery-shell"]}
          aria-busy={isLoadingMetadata || isLoadingMore}
          aria-label={isLoadingMetadata ? "Cargando galería" : "Galería de fotos"}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        >
          <div ref={scrollContainerRef} className={styles["gallery-scroll"]}>
            {error && !galleryPhotos.length && !isLoadingMetadata ? (
              <div className={styles["gallery-error"]} role="alert">
                <p>No se pudo cargar la galería de fotos.</p>
              </div>
            ) : (
              <div className={styles.gallery}>
                {isLoadingMetadata
                  ? Array.from({ length: PAGE_SIZE }, (_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className={styles["photo-placeholder"]}
                        aria-hidden
                      >
                        <div className={styles["photo-frame"]}>
                          <div className={styles["photo-skeleton"]} />
                        </div>
                      </div>
                    ))
                  : galleryPhotos.map((photo, index) => (
                      <GalleryPhoto
                        key={photo.publicId}
                        photo={photo}
                        index={index}
                        isLoaded={loadedPhotoIds.has(photo.publicId)}
                        onSelect={() => setSelectedPublicId(photo.publicId)}
                        onLoad={handlePhotoLoad}
                        onError={handlePhotoError}
                        onHover={() => prefetchLightboxPhoto(photo, Boolean(poems[photo.publicId]))}
                      />
                    ))}
                {isLoadingMore &&
                  Array.from({ length: PAGE_SIZE }, (_, index) => (
                    <div
                      key={`loading-skeleton-${index}`}
                      className={styles["photo-placeholder"]}
                      aria-hidden
                    >
                      <div className={styles["photo-frame"]}>
                        <div className={styles["photo-skeleton"]} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {paginationRetryAvailable && (
              <button
                type="button"
                className={styles["pagination-retry"]}
                onClick={onRetryLoadMore}
              >
                Reintentar
              </button>
            )}
            <div ref={sentinelRef} className={styles["load-more-sentinel"]} aria-hidden />
          </div>
        </motion.div>
      </AnimatePresence>
      {selectedIndex >= 0 && (
        <Lightbox
          photos={galleryPhotos}
          currentIndex={selectedIndex}
          poems={poems}
          onNavigate={(index) => setSelectedPublicId(galleryPhotos[index]?.publicId ?? null)}
          onClose={() => setSelectedPublicId(null)}
        />
      )}
    </>
  );
};

export default Gallery;
