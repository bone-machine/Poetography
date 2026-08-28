import type { Photo } from "../types/photo";

import { cloudinaryImage } from "./cloudinaryImage";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

const prefetchedUrls = new Map<string, "pending" | "fulfilled">();

/** Never request more than this from Cloudinary for the lightbox. */
const LIGHTBOX_MAX_WIDTH = 3840;

export function canPrefetchImages(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;

  if (!connection) return true;
  if (connection.saveData) return false;

  const slowConnections = ["slow-2g", "2g"];
  if (connection.effectiveType && slowConnections.includes(connection.effectiveType)) {
    return false;
  }

  return true;
}

/** Cap to the pixels actually displayed — saves bandwidth vs native DSLR resolution. */
type LightboxLayout = {
  width: number;
  height: number;
};

export function getLightboxImageWidth(
  photoWidth: number,
  photoHeight: number,
  hasPoem = false,
  layout?: LightboxLayout,
): number {
  const dpr = window.devicePixelRatio || 1;
  const isDesktop = window.matchMedia("(width >= 768px)").matches;
  const poemPanelWidth = isDesktop && hasPoem ? Math.min(384, window.innerWidth * 0.35) : 0;
  const horizontalPadding = isDesktop ? 64 : 32;
  const verticalPadding = isDesktop ? 64 : 32;
  const displayWidth = layout
    ? layout.width
    : window.innerWidth - poemPanelWidth - horizontalPadding;
  const displayHeight = layout
    ? layout.height
    : window.innerHeight - (hasPoem && !isDesktop ? window.innerHeight * 0.4 : 0) - verticalPadding;
  const widthConstrainedByHeight = Math.max(displayHeight, 0) * (photoWidth / photoHeight);

  return Math.min(
    photoWidth,
    Math.max(Math.ceil(Math.max(displayWidth, 0) * dpr), 1),
    Math.max(Math.ceil(Math.max(widthConstrainedByHeight, 0) * dpr), 1),
    LIGHTBOX_MAX_WIDTH,
  );
}

export function getLightboxImageUrl(
  photo: Photo,
  hasPoem = false,
  layout?: LightboxLayout,
): string {
  return cloudinaryImage(
    photo.url,
    photo.publicId,
    getLightboxImageWidth(photo.width, photo.height, hasPoem, layout),
  );
}

export function prefetchImage(url: string): void {
  if (!canPrefetchImages() || prefetchedUrls.has(url)) return;

  prefetchedUrls.set(url, "pending");
  const image = new Image();
  image.fetchPriority = "low";
  image.onload = () => prefetchedUrls.set(url, "fulfilled");
  image.onerror = () => prefetchedUrls.delete(url);

  image.src = url;
}

export function prefetchLightboxPhoto(photo: Photo, hasPoem = false): void {
  prefetchImage(getLightboxImageUrl(photo, hasPoem));
}

export function prefetchAdjacentLightboxPhotos(
  photos: Photo[],
  index: number,
  hasPoem: (photo: Photo) => boolean = () => false,
): void {
  if (index > 0) {
    prefetchLightboxPhoto(photos[index - 1], hasPoem(photos[index - 1]));
  }
  if (index < photos.length - 1) {
    prefetchLightboxPhoto(photos[index + 1], hasPoem(photos[index + 1]));
  }
}
