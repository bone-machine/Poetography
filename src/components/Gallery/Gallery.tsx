import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import Lightbox from "../Lightbox/Lightbox";
import poemsData from "../../data/poems.json";
import type { Photo } from "../../types/photo";
import type { Poems } from "../../types/poem";
import { prefetchLightboxPhoto } from "../../utils/prefetchImage";
import photoManifest from "../../data/photoManifest.json";

import GalleryPhoto from "./GalleryPhoto";
import styles from "./Gallery.module.css";

const poems = poemsData as Poems;
const METADATA_SKELETON_COUNT = 8;
const metadataSkeletons =
  photoManifest.length > 0
    ? photoManifest
    : Array.from({ length: METADATA_SKELETON_COUNT }, (_, index) => ({
        publicId: `metadata-skeleton-${index}`,
        width: 3,
        height: 2,
      }));

type GalleryProps = {
  galleryPhotos: Photo[];
  isLoadingMetadata: boolean;
  photosFolderName: string | null;
};

const Gallery = ({ galleryPhotos, isLoadingMetadata, photosFolderName }: GalleryProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedPublicId, setSelectedPublicId] = useState<string | null>(null);
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Set<string>>(() => new Set());
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

  const galleryKey = photosFolderName ?? "all-photos";

  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={galleryKey}
          className={styles.gallery}
          aria-busy={isLoadingMetadata}
          aria-label={isLoadingMetadata ? "Cargando galería" : undefined}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        >
          {isLoadingMetadata
            ? metadataSkeletons.map((skeleton) => (
                <div key={skeleton.publicId} className={styles["photo-placeholder"]} aria-hidden>
                  <div
                    className={styles["photo-frame"]}
                    style={{ aspectRatio: `${skeleton.width} / ${skeleton.height}` }}
                  >
                    <div className={styles["photo-skeleton"]} />
                  </div>
                </div>
              ))
            : galleryPhotos.map((photo, i) => (
                <GalleryPhoto
                  key={photo.publicId}
                  photo={photo}
                  index={i}
                  isLoaded={loadedPhotoIds.has(photo.publicId)}
                  onSelect={() => setSelectedPublicId(photo.publicId)}
                  onLoad={handlePhotoLoad}
                  onError={handlePhotoError}
                  onHover={() => prefetchLightboxPhoto(photo, Boolean(poems[photo.publicId]))}
                />
              ))}
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
