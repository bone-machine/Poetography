# Poetography project context

## What this project is

Poetography is a React 19 + TypeScript + Vite portfolio for displaying photographic work from Cloudinary. Photos are organized into `analog` and `digital` Cloudinary folders, with support for nested album folders. Some photos have associated poems that are stored locally and displayed in the Lightbox.

The application is deployed to Netlify. Netlify hosts the frontend build and the serverless function that queries Cloudinary’s Search API. Cloudinary credentials must remain server-side.

## Main architecture

- `src/App.tsx`
  - Owns the selected Cloudinary folder/filter.
  - Loads the generated album manifest.
  - Calls `usePhotos` and passes metadata/loading/error/pagination state to `Gallery`.

- `src/hooks/usePhotos.ts`
  - Loads the first photo page and subsequent pages.
  - Uses 12 photos per server page.
  - Caches photo metadata in `localStorage`, separated by folder and cache version.
  - Uses a one-hour cache TTL.
  - Keeps stale cached photos visible if a refresh request fails.
  - Uses `AbortController` and request IDs so stale requests cannot overwrite a newer folder/filter selection.
  - Automatically retries transient pagination failures twice after the initial attempt, with short backoff delays.
  - Exposes a subtle manual pagination retry link only after automatic retries are exhausted.

- `src/components/Gallery/Gallery.tsx`
  - Owns the internal scrollable gallery viewport.
  - Displays a three-column square grid on desktop and one column on mobile.
  - Uses an `IntersectionObserver` sentinel near the bottom to request more photos.
  - Shows initial loading skeletons and an initial-load error/retry state.
  - Opens the Lightbox for the selected photo.

- `src/components/Gallery/GalleryPhoto.tsx`
  - Displays each square thumbnail.
  - Tracks image load/error state for the skeleton transition.
  - Uses eager loading for the first four thumbnails and high fetch priority for the first three.
  - Prefetches the corresponding Lightbox image after a desktop hover.

- `src/components/Lightbox/Lightbox.tsx`
  - Displays the selected photo with directional slide-in/slide-out transitions.
  - Supports mouse/keyboard navigation on desktop and swipe navigation on mobile.
  - Uses React keys based on `photo.publicId` so changing photos resets image loading state correctly.
  - Displays poems beside the image on desktop.
  - On mobile, poems are opened through an animated bottom-right toggle button and displayed in a full-viewport overlay with its own vertical scrolling.
  - Mobile poem touch events are isolated so vertical reading does not trigger horizontal photo navigation.
  - Navigation arrows are always mounted on desktop and use native `disabled` state at the first/last photo, with CSS visual feedback.
  - Includes a full-viewport blurred background based on the current photo. The background currently crossfades independently from the foreground photo slide.

- `src/utils/cloudinaryImage.ts`
  - Builds Cloudinary delivery URLs.
  - Lightbox images use aspect-ratio-preserving `c_limit` transformations sized to the available layout.
  - Gallery thumbnails use square `c_fill,g_center` transformations so wide/tall originals do not get stretched into blurry square thumbnails.
  - Gallery thumbnails use responsive `srcSet` variants of 200, 400, and 800 pixels.

- `src/utils/prefetchImage.ts`
  - Prefetches adjacent Lightbox images in an in-memory URL map.
  - Avoids prefetching on save-data or very slow connections.
  - Caps Lightbox delivery width and buckets dynamic widths for CDN reuse.

- `netlify/functions/photosHandler.ts`
  - Validates folder paths against `analog`/`digital` roots and safe nested segments.
  - Queries Cloudinary Search API for a root folder and all nested folders.
  - Sorts by `public_id`, returns 12 photos, and exposes Cloudinary’s `next_cursor`.
  - Returns JSON with `photos` and `nextCursor`.

- `scripts/generate-album-manifest.mjs`
  - Runs during builds before TypeScript/Vite compilation.
  - Queries Cloudinary server-side, discovers nested folders, and writes `src/data/albums.json`.
  - The generated manifest contains localized root labels and humanized album labels.

## Data and content conventions

Photo metadata has this shape:

```ts
type Photo = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};
```

Poems are stored in `src/data/poems.json` and keyed by the exact Cloudinary `publicId`:

```ts
type Poem = {
  title?: string;
  text: string;
};
```

Album folders are represented by paths such as `analog/odyssey`. The “All” filter sends no folder parameter; root and album buttons send the corresponding folder path.

## Build, development, and checks

Useful commands:

```bash
npm run dev
npm run lint
npm run lint:css
npx tsc --noEmit
npm run build
```

`npm run build` regenerates the album manifest and therefore requires valid Cloudinary credentials and network access. Run it when explicitly requested or when validating the deployment/build pipeline. For ordinary UI changes, linting, CSS linting, TypeScript, and `git diff --check` are usually sufficient.

Prettier is already used by the project; avoid unrelated formatting churn. CSS modules use Stylelint ordering rules. Preserve existing user changes in a dirty worktree and inspect `git diff` before editing overlapping files.

## Important UX decisions already made

- Gallery thumbnails are square, centered crops. Do not revert to aspect-ratio-preserving thumbnail URLs while retaining `object-fit: cover`; very wide originals can then be upscaled in their short dimension and appear blurry.
- The Gallery itself is the vertically scrollable area; the application viewport remains fixed.
- Pagination should be quiet: existing photos stay visible, transient failures retry automatically, and a small retry link appears only after repeated failure. Do not add an alarming “more photos unavailable” message without explicit approval.
- Changing folder/filter selection must abort or ignore requests belonging to the previous selection.
- Lightbox foreground photo transitions slide directionally. Poem transitions and mobile poem overlay behavior should not cause the image viewport to change height.
- Mobile navigation relies on swipes; the desktop navigation container is hidden on mobile.
- Respect `prefers-reduced-motion` for Motion transitions and CSS animations.

## Current known considerations

- Lightbox first-mount animation smoothness has been investigated but is not fully resolved. A recent experiment using server-blurred placeholders, image decoding, and priority changes was reverted. The current Lightbox background intentionally uses a small Cloudinary image enlarged with CSS blur and a crossfade.
- Do not commit changes automatically unless explicitly requested.
