import { BookOpen, ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";
import type { SwipeableHandlers } from "react-swipeable";

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

type PhotoPanelProps = {
  photo: Photo;
  hasPoem: boolean;
  onClose: () => void;
  navigationDirection: number;
};

const PhotoPanel = ({ photo, hasPoem, onClose, navigationDirection }: PhotoPanelProps) => {
  const prefersReducedMotion = useReducedMotion();
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState(() => getLightboxImageUrl(photo, hasPoem));
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageState =
    failedImageUrl === imageUrl ? "error" : loadedImageUrl === imageUrl ? "loaded" : "loading";

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

  return (
    <motion.div
      className={styles["image-container"]}
      onClick={onClose}
      ref={(element) => {
        imageContainerRef.current = element;
      }}
      custom={navigationDirection}
      variants={{
        enter: (direction: number) => ({ x: `${direction * 100}%` }),
        center: { x: 0 },
        exit: (direction: number) => ({ x: `${direction * -100}%` }),
      }}
      initial={prefersReducedMotion ? false : "enter"}
      animate="center"
      exit={prefersReducedMotion ? undefined : "exit"}
      transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
    >
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
    </motion.div>
  );
};

type LightboxContentProps = {
  photo: Photo;
  poem: Poems[string] | undefined;
  onClose: () => void;
  swipeHandlers: Omit<SwipeableHandlers, "ref">;
  swipeRef: SwipeableHandlers["ref"];
  navigationDirection: number;
  shouldAnimatePoem: boolean;
};

const LightboxContent = ({
  photo,
  poem,
  onClose,
  swipeHandlers,
  swipeRef,
  navigationDirection,
  shouldAnimatePoem,
}: LightboxContentProps) => {
  const prefersReducedMotion = useReducedMotion();
  const poemRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(width < 768px)").matches);
  const [visiblePoemPhotoId, setVisiblePoemPhotoId] = useState<string | null>(null);
  const isPoemVisible = visiblePoemPhotoId === photo.publicId;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(width < 768px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener("change", updateIsMobile);
    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    poemRef.current?.scrollTo(0, 0);
  }, [photo.publicId]);

  return (
    <>
      <div className={styles["image-viewport"]} ref={swipeRef} {...swipeHandlers}>
        <AnimatePresence initial={false} mode="sync" custom={navigationDirection}>
          <PhotoPanel
            key={photo.publicId}
            photo={photo}
            hasPoem={Boolean(poem)}
            onClose={onClose}
            navigationDirection={navigationDirection}
          />
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {poem && (
            <motion.button
              key={`poem-toggle-${photo.publicId}`}
              type="button"
              className={styles["poem-toggle"]}
              aria-label={isPoemVisible ? "Ocultar poema" : "Mostrar poema"}
              aria-expanded={isPoemVisible}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
              onClick={(event) => {
                event.stopPropagation();
                setVisiblePoemPhotoId((visiblePhotoId) =>
                  visiblePhotoId === photo.publicId ? null : photo.publicId,
                );
              }}
            >
              <BookOpen className={styles["poem-toggle-icon"]} aria-hidden />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false} mode="wait">
        {poem && (!isMobile || isPoemVisible) && (
          <motion.div
            key={photo.publicId}
            ref={poemRef}
            className={styles["poem-container"]}
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
            initial={
              prefersReducedMotion || (!shouldAnimatePoem && !isPoemVisible)
                ? false
                : { opacity: 0 }
            }
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{
              duration: prefersReducedMotion || (!shouldAnimatePoem && !isPoemVisible) ? 0 : 0.2,
              ease: "easeOut",
              delay: isMobile || prefersReducedMotion || !shouldAnimatePoem ? 0 : 0.15,
            }}
          >
            {poem.title && <h2 className={styles["poem-title"]}>{poem.title}</h2>}
            <p className={styles["poem-text"]}>{poem.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Lightbox = ({ photos, currentIndex, poems, onNavigate, onClose }: LightboxProps) => {
  const prefersReducedMotion = useReducedMotion();
  const photo = photos[currentIndex];
  const poem = poems[photo.publicId];
  const activePhotoIndexRef = useRef(currentIndex);
  const [navigationDirection, setNavigationDirection] = useState(1);
  const [shouldAnimatePoem, setShouldAnimatePoem] = useState(false);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === photos.length - 1;

  useEffect(() => {
    activePhotoIndexRef.current = currentIndex;
  }, [currentIndex]);

  const navigateTo = useCallback(
    (index: number) => {
      setNavigationDirection(index > activePhotoIndexRef.current ? 1 : -1);
      setShouldAnimatePoem(true);
      onNavigate(index);
    },
    [onNavigate],
  );

  const { ref: swipeRef, ...swipeHandlers } = useSwipeable({
    onSwipedLeft: () => {
      if (!isLast) navigateTo(activePhotoIndexRef.current + 1);
    },
    onSwipedRight: () => {
      if (!isFirst) navigateTo(activePhotoIndexRef.current - 1);
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

      if (event.key === "ArrowLeft" && activePhotoIndexRef.current > 0) {
        navigateTo(activePhotoIndexRef.current - 1);
        return;
      }

      if (event.key === "ArrowRight" && activePhotoIndexRef.current < photos.length - 1) {
        navigateTo(activePhotoIndexRef.current + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [navigateTo, onClose, photos.length]);

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
      <div className={`${styles.content} ${poem ? styles["content-with-poem"] : ""}`}>
        <LightboxContent
          photo={photo}
          poem={poem}
          onClose={onClose}
          swipeHandlers={swipeHandlers}
          swipeRef={swipeRef}
          navigationDirection={navigationDirection}
          shouldAnimatePoem={shouldAnimatePoem}
        />
      </div>
      <div
        className={styles["nav-container"]}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <button
          type="button"
          className={`${styles["nav-button"]} ${styles["nav-button-prev"]}`}
          aria-label="Foto anterior"
          disabled={isFirst}
          onClick={(event) => {
            event.stopPropagation();
            navigateTo(currentIndex - 1);
          }}
        >
          <ChevronLeft className={styles["nav-icon"]} aria-hidden />
        </button>
        <button
          type="button"
          className={`${styles["nav-button"]} ${styles["nav-button-next"]}`}
          aria-label="Foto siguiente"
          disabled={isLast}
          onClick={(event) => {
            event.stopPropagation();
            navigateTo(currentIndex + 1);
          }}
        >
          <ChevronRight className={styles["nav-icon"]} aria-hidden />
        </button>
      </div>
    </motion.div>
  );
};

export default Lightbox;
