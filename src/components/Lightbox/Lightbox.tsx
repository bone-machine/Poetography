import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";

import type { Photo } from "../../types/photo";
import type { Poems } from "../../types/poem";
import { cloudinaryImage } from "../../utils/cloudinaryImage";
import { getLightboxImageUrl, prefetchAdjacentLightboxPhotos } from "../../utils/prefetchImage";

import styles from "./Lightbox.module.css";

type LightboxProps = {
  photos: Photo[];
  currentIndex: number;
  poems: Poems;
  onNavigate: (index: number) => void;
  onClose: () => void;
};

const Lightbox = ({ photos, currentIndex, poems, onNavigate, onClose }: LightboxProps) => {
  const prefersReducedMotion = useReducedMotion();
  const poemRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const photo = photos[currentIndex];
  const poem = poems[photo.publicId];
  const hasPoem = Boolean(poem);
  const [imageUrl, setImageUrl] = useState(() => getLightboxImageUrl(photo, hasPoem));
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageState =
    failedImageUrl === imageUrl ? "error" : loadedImageUrl === imageUrl ? "loaded" : "loading";
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === photos.length - 1;

  const { ref: swipeRef, ...swipeHandlers } = useSwipeable({
    onSwipedLeft: () => {
      if (!isLast) onNavigate(currentIndex + 1);
    },
    onSwipedRight: () => {
      if (!isFirst) onNavigate(currentIndex - 1);
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
        return;
      }

      if (event.key === "ArrowRight" && currentIndex < photos.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [currentIndex, onClose, onNavigate, photos.length]);

  useEffect(() => {
    poemRef.current?.scrollTo(0, 0);
  }, [photo.publicId]);

  useEffect(() => {
    const imageContainer = imageContainerRef.current;
    if (!imageContainer) return;

    const updateImageUrl = () => {
      const computedStyle = window.getComputedStyle(imageContainer);
      const horizontalPadding =
        parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
      const verticalPadding =
        parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

      setImageUrl(
        getLightboxImageUrl(photo, hasPoem, {
          width: Math.max(imageContainer.clientWidth - horizontalPadding, 0),
          height: Math.max(imageContainer.clientHeight - verticalPadding, 0),
        }),
      );
    };

    updateImageUrl();
    const resizeObserver = new ResizeObserver(updateImageUrl);
    resizeObserver.observe(imageContainer);

    return () => resizeObserver.disconnect();
  }, [photo, hasPoem]);

  useEffect(() => {
    prefetchAdjacentLightboxPhotos(photos, currentIndex, (adjacentPhoto) =>
      Boolean(poems[adjacentPhoto.publicId]),
    );
  }, [photos, currentIndex, poems]);

  return (
    <motion.div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label="Vista ampliada de la foto"
      onClick={onClose}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
    >
      <button
        type="button"
        className={styles["close-button"]}
        onClick={onClose}
        aria-label="Cerrar"
      >
        <X className={styles["close-icon"]} aria-hidden />
      </button>
      <motion.div
        className={styles.content}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div
          className={styles["image-container"]}
          onClick={onClose}
          {...swipeHandlers}
          ref={(element) => {
            imageContainerRef.current = element;
            swipeRef(element);
          }}
        >
          {!isFirst && (
            <button
              type="button"
              className={`${styles["nav-button"]} ${styles["nav-button-prev"]}`}
              aria-label="Foto anterior"
              onClick={(event) => {
                event.stopPropagation();
                onNavigate(currentIndex - 1);
              }}
            >
              <ChevronLeft className={styles["nav-icon"]} aria-hidden />
            </button>
          )}
          {imageState !== "error" && (
            <img
              className={`${styles["blurred-image"]} ${imageState === "loaded" ? styles["blurred-image-hidden"] : ""}`}
              src={cloudinaryImage(photo.url, photo.publicId, 400)}
              alt=""
              aria-hidden
            />
          )}
          {imageState === "loading" && (
            <LoaderCircle className={styles["loading-indicator"]} aria-hidden />
          )}
          {imageState === "error" && (
            <p className={styles["image-error"]}>No se pudo cargar la foto.</p>
          )}
          <img
            className={`${styles.image} ${imageState === "loaded" ? styles["image-loaded"] : ""}`}
            src={imageUrl}
            width={photo.width}
            height={photo.height}
            alt=""
            onLoad={() => setLoadedImageUrl(imageUrl)}
            onError={() => setFailedImageUrl(imageUrl)}
            onClick={(event) => event.stopPropagation()}
          />
          {!isLast && (
            <button
              type="button"
              className={`${styles["nav-button"]} ${styles["nav-button-next"]}`}
              aria-label="Foto siguiente"
              onClick={(event) => {
                event.stopPropagation();
                onNavigate(currentIndex + 1);
              }}
            >
              <ChevronRight className={styles["nav-icon"]} aria-hidden />
            </button>
          )}
        </div>
        {poem && (
          <div
            ref={poemRef}
            className={styles["poem-container"]}
            onClick={(event) => event.stopPropagation()}
          >
            {poem.title && <h2 className={styles["poem-title"]}>{poem.title}</h2>}
            <p className={styles["poem-text"]}>{poem.text}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Lightbox;
