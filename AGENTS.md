# Poetography project context

## What this project is

Poetography is a React 19 + TypeScript + Vite portfolio for displaying photographic work from Cloudinary. Photos are organized into `analog` and `digital` Cloudinary folders, with support for nested album folders. Some photos have associated poems that are stored locally and displayed in the Lightbox.

The application is deployed to Netlify. Netlify hosts the frontend build. Cloudinary credentials are used only during the build process to generate the photo manifest and must remain server-side (in Netlify environment variables, never committed to repository).

## Main architecture

- `src/App.tsx`
  - Owns the selected Cloudinary folder/filter.
  - Loads the generated album manifest.
  - Calls `usePhotos` and passes metadata/loading/error/pagination state to `Gallery`.

- `src/hooks/usePhotos.ts`
  - Loads photo metadata synchronously from the build-time manifest for the selected folder (or the "All" view).
  - Resolves folders using `getPhotosForFolder`: "Todas" (null) → `Object.values(photosByFolder).flat()`; root folder (e.g., "analog") → filter by `folder === root || folder.startsWith(root + '/')` and flatten; specific album → direct lookup in `photosByFolder`.
  - Paginates client-side through the in-memory photo array in PAGE_SIZE batches (12 photos per page).
  - Shows loading skeletons on initial mount and on folder switches until the manifest data is exposed.
  - Uses `flushSync` from `react-dom` in the `loadMore` function to guarantee the loading skeleton renders before pagination completes, preventing React's automatic batching from hiding the loading state.
  - Uses `queueMicrotask` in the mount effect to populate the manifest data, allowing React to render the loading skeleton on initial mount and folder switches before the data is exposed.
  - Keeps the IntersectionObserver-based load-more pattern from Gallery component.
  - No longer fetches photo metadata from the Netlify function or Cloudinary Search API during normal browsing.
  - Eliminated localStorage caching, AbortController for metadata requests, retry loops, and cursor-based pagination—all replaced by simple in-memory array operations.
  - The `photosHandler` Netlify function is retained but unused during normal operation; it exists as the server-side Cloudinary credential boundary for potential future webhook flows or debugging.

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
  - Queries Cloudinary server-side, auto-discovers root folders and nested albums from all image resources, and writes `src/data/photoManifest.json`.
  - The generated manifest contains localized root labels, humanized album labels, and a `photosByFolder` map with ordered photos per leaf folder only (no parent-child duplication, no `allPhotos` field). Root folders are discovered dynamically from the Cloudinary folder structure; they are not hardcoded.
  - The `photosHandler` Netlify function is retained but unused during normal operation; it exists as the server-side Cloudinary credential boundary for potential future webhook flows or debugging.

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

Album folders are represented by paths such as `analog/odyssey`. The manifest's `photosByFolder` map contains an entry for every folder path that has photos directly in it — no parent aggregation, no `allPhotos` field. Photos in `analog/odyssey/` appear only in `photosByFolder["analog/odyssey"]`, never also in an aggregated `photosByFolder["analog"]` entry. A root folder like `digital` can have its own entry if it has direct photos. Each photo appears exactly once. The "Todas" (All) view is computed at runtime as `Object.values(photosByFolder).flat()`. Root folder views (e.g., "Analógicas") filter by prefix (`folder === 'analog' || folder.startsWith('analog/')`). The "All" filter sends no folder parameter; root and album buttons send the corresponding folder path.

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

## Build-time and runtime manifest validation

The project uses two validators that enforce the same rules:

- `scripts/validate-photo-manifest.mjs` (build-time): runs during `npm run build`. Validates version, roots, albums, photosByFolder structure, photo fields, and checks for duplicate publicIds within and across folders. Exits with non-zero on failure, which stops the build and prevents deployment.
- `src/hooks/usePhotos.ts` `validateManifest` (runtime): runs when the app loads the manifest. Validates the same structural rules and checks for duplicate publicIds. Returns `false` → app shows "Failed to load photos" error.

Both validators enforce: no duplicate publicIds in the manifest (each photo appears exactly once). This catches data corruption or generation bugs.

`package.json` build pipeline: `npm run generate:albums && npm run validate:manifest && tsc -b && vite build`. If validation fails, the build stops before TypeScript compilation and Vite build.

## Important UX decisions already made

- Gallery thumbnails are square, centered crops. Do not revert to aspect-ratio-preserving thumbnail URLs while retaining `object-fit: cover`; very wide originals can then be upscaled in their short dimension and appear blurry.
- The Gallery itself is the vertically scrollable area; the application viewport remains fixed.
- Pagination should be quiet: new photos are paginated from the in-memory manifest array as the user scrolls. Since pagination is now synchronous array slicing, there are no transient failures. The `paginationRetryAvailable` state is retained for interface compatibility but is never set to true in normal operation.
- The `loadMore` function uses `flushSync` from `react-dom` to force a synchronous render of the loading skeleton before pagination updates. This ensures the loading state is always visible to the user, even with React's automatic batching. This is a deliberate UX choice demonstrating attention to detail.
- Changing folder/filter selection must abort or ignore requests belonging to the previous selection.
- Lightbox foreground photo transitions slide directionally. Poem transitions and mobile poem overlay behavior should not cause the image viewport to change height.
- Mobile navigation relies on swipes; the desktop navigation container is hidden on mobile.
- Respect `prefers-reduced-motion` for Motion transitions and CSS animations.

## Current known considerations

- Lightbox first-mount animation smoothness has been investigated but is not fully resolved. A recent experiment using server-blurred placeholders, image decoding, and priority changes was reverted. The current Lightbox background intentionally uses a small Cloudinary image enlarged with CSS blur and a crossfade.
- Do not commit changes automatically unless explicitly requested.
