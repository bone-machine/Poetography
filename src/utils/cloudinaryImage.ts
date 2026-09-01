const CLOUDINARY_BASE_URL = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\//;

function parseCloudinaryUrl(url: string) {
  const match = url.match(CLOUDINARY_BASE_URL);
  if (!match) return null;

  const [, cloudName, resourceType] = match;
  return { cloudName, resourceType };
}

/** Max display width (CSS px) per breakpoint — keep in sync with Gallery.module.css */
export const IMAGE_DISPLAY_WIDTH = {
  mobile: 200,
  desktop: 400,
} as const;

/** Width used for the img `src` fallback when srcSet is unavailable. */
export const IMAGE_FALLBACK_WIDTH = IMAGE_DISPLAY_WIDTH.desktop;

/** Widths requested from Cloudinary; browser picks via srcSet + sizes. */
export const IMAGE_SRCSET_WIDTHS = [
  IMAGE_DISPLAY_WIDTH.mobile,
  IMAGE_DISPLAY_WIDTH.desktop,
  IMAGE_DISPLAY_WIDTH.desktop * 2,
] as const;

export const IMAGE_SIZES = `(max-width: 767px) ${IMAGE_DISPLAY_WIDTH.mobile}px, ${IMAGE_DISPLAY_WIDTH.desktop}px`;

function buildCloudinaryUrl(
  cloudName: string,
  resourceType: string,
  publicId: string,
  width: number,
): string {
  // c_limit preserves aspect ratio — no square crop for portrait or landscape.
  const transforms = `c_limit,w_${width}/f_auto/q_auto`;
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transforms}/${publicId}`;
}

export function cloudinaryImage(url: string, publicId: string, width: number): string {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return url;

  return buildCloudinaryUrl(parsed.cloudName, parsed.resourceType, publicId, width);
}

function buildCloudinaryThumbnailUrl(
  cloudName: string,
  resourceType: string,
  publicId: string,
  width: number,
): string {
  const transforms = `c_fill,g_center,w_${width},h_${width}/f_auto/q_auto`;
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${transforms}/${publicId}`;
}

export function cloudinaryThumbnail(url: string, publicId: string, width: number): string {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return url;

  return buildCloudinaryThumbnailUrl(parsed.cloudName, parsed.resourceType, publicId, width);
}

export function cloudinarySrcSet(
  url: string,
  publicId: string,
  widths: readonly number[] = IMAGE_SRCSET_WIDTHS,
): string {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return "";

  return widths
    .map(
      (width) =>
        `${buildCloudinaryUrl(parsed.cloudName, parsed.resourceType, publicId, width)} ${width}w`,
    )
    .join(", ");
}

export function cloudinaryThumbnailSrcSet(
  url: string,
  publicId: string,
  widths: readonly number[] = IMAGE_SRCSET_WIDTHS,
): string {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return "";

  return widths
    .map(
      (width) =>
        `${buildCloudinaryThumbnailUrl(parsed.cloudName, parsed.resourceType, publicId, width)} ${width}w`,
    )
    .join(", ");
}
