import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { Photo } from "../../types/photo";
import {
  cloudinaryImage,
  cloudinarySrcSet,
  IMAGE_FALLBACK_WIDTH,
  IMAGE_SIZES,
} from "../../utils/cloudinaryImage";

import styles from "./Gallery.module.css";

type GalleryPhotoProps = {
  photo: Photo;
  index: number;
  onSelect: () => void;
  onHover: () => void;
};

const GalleryPhoto = ({ photo, index, onSelect, onHover }: GalleryPhotoProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }

    return () => {
      if (hoverTimerRef.current !== null) {
        window.clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

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
      <div
        className={styles["photo-frame"]}
        style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        <div
          className={styles["photo-skeleton"]}
          aria-hidden
          data-reduced-motion={prefersReducedMotion || undefined}
        />
        <img
          ref={imageRef}
          className={`${styles["photo-image"]} ${isLoaded ? styles["photo-image-loaded"] : ""}`}
          src={cloudinaryImage(photo.url, photo.publicId, IMAGE_FALLBACK_WIDTH)}
          srcSet={cloudinarySrcSet(photo.url, photo.publicId)}
          sizes={IMAGE_SIZES}
          width={photo.width}
          height={photo.height}
          alt={`Photo ${index + 1}`}
          loading={index < 4 ? "eager" : "lazy"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(false)}
          data-reduced-motion={prefersReducedMotion || undefined}
        />
      </div>
    </button>
  );
};

export default GalleryPhoto;
