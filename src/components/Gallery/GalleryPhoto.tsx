import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import type { Photo } from "../../types/photo";
import {
  cloudinaryThumbnail,
  cloudinaryThumbnailSrcSet,
  IMAGE_FALLBACK_WIDTH,
  IMAGE_SIZES,
} from "../../utils/cloudinaryImage";

import styles from "./Gallery.module.css";

type GalleryPhotoProps = {
  photo: Photo;
  index: number;
  isLoaded: boolean;
  onSelect: () => void;
  onLoad: (publicId: string) => void;
  onError: (publicId: string) => void;
  onHover: () => void;
};

const GalleryPhoto = ({
  photo,
  index,
  isLoaded,
  onSelect,
  onLoad,
  onError,
  onHover,
}: GalleryPhotoProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      onLoad(photo.publicId);
    }

    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, [onLoad, photo.publicId]);

  const prefetchAfterHover = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
    }

    hoverTimerRef.current = window.setTimeout(onHover, 200);
  };

  const cancelHoverPrefetch = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  return (
    <button
      type="button"
      className={styles["photo-button"]}
      onClick={onSelect}
      onMouseEnter={prefetchAfterHover}
      onMouseLeave={cancelHoverPrefetch}
      aria-busy={!isLoaded}
    >
      <div className={styles["photo-frame"]}>
        <div
          className={styles["photo-skeleton"]}
          aria-hidden
          data-reduced-motion={prefersReducedMotion || undefined}
        />
        <img
          ref={imageRef}
          className={`${styles["photo-image"]} ${isLoaded ? styles["photo-image-loaded"] : ""}`}
          src={cloudinaryThumbnail(photo.url, photo.publicId, IMAGE_FALLBACK_WIDTH)}
          srcSet={cloudinaryThumbnailSrcSet(photo.url, photo.publicId)}
          sizes={IMAGE_SIZES}
          width={photo.width}
          height={photo.height}
          alt={`Photo ${index + 1}`}
          loading={index < 4 ? "eager" : "lazy"}
          fetchPriority={index < 3 ? "high" : "auto"}
          onLoad={() => onLoad(photo.publicId)}
          onError={() => onError(photo.publicId)}
          data-reduced-motion={prefersReducedMotion || undefined}
        />
      </div>
    </button>
  );
};

export default GalleryPhoto;
