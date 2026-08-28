import { useState } from "react";

import Lightbox from "../Lightbox/Lightbox";
import poemsData from "../../data/poems.json";
import type { Photo } from "../../types/photo";
import type { Poems } from "../../types/poem";
import { prefetchLightboxPhoto } from "../../utils/prefetchImage";

import GalleryPhoto from "./GalleryPhoto";
import styles from "./Gallery.module.css";

const poems = poemsData as Poems;
const METADATA_SKELETON_COUNT = 8;

type GalleryProps = {
  galleryPhotos: Photo[];
  isLoadingMetadata: boolean;
};

const Gallery = ({ galleryPhotos, isLoadingMetadata }: GalleryProps) => {
  const [selectedPublicId, setSelectedPublicId] = useState<string | null>(null);
  const selectedIndex = selectedPublicId
    ? galleryPhotos.findIndex((photo) => photo.publicId === selectedPublicId)
    : -1;

  return (
    <>
      <div
        className={styles.gallery}
        aria-busy={isLoadingMetadata}
        aria-label={isLoadingMetadata ? "Cargando galería" : undefined}
      >
        {isLoadingMetadata
          ? Array.from({ length: METADATA_SKELETON_COUNT }, (_, i) => (
              <div
                key={`metadata-skeleton-${i}`}
                className={styles["photo-placeholder"]}
                aria-hidden
              >
                <div className={styles["photo-frame"]} style={{ aspectRatio: "3 / 2" }}>
                  <div className={styles["photo-skeleton"]} />
                </div>
              </div>
            ))
          : galleryPhotos.map((photo, i) => (
              <GalleryPhoto
                key={photo.publicId}
                photo={photo}
                index={i}
                onSelect={() => setSelectedPublicId(photo.publicId)}
                onHover={() => prefetchLightboxPhoto(photo, Boolean(poems[photo.publicId]))}
              />
            ))}
      </div>
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
