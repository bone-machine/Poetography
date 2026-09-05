# Poetography design

## Overview

The application is a React 19 + TypeScript + Vite frontend deployed to Netlify. Netlify Functions provide the server-side Cloudinary metadata boundary. Cloudinary serves the actual image assets and dynamically transformed variants.

## Data flow

```text
App filter state
        ↓
usePhotos(folder)
        ↓
Build-time photo manifest (photoManifest.json)
        ↓
In-memory photo array (synchronous, no network)
        ↓
Gallery → Lightbox
```

`App.tsx` owns the selected folder. `usePhotos` loads photo metadata synchronously from the build-time manifest, paginates client-side through the in-memory array using `flushSync` to guarantee loading skeletons render, and no longer fetches from the Netlify function or Cloudinary Search API during normal browsing. `Gallery` owns the scrollable presentation and selection. `Lightbox` owns photo navigation and poem presentation.

## Cloudinary organization

Root folders are auto-discovered from all Cloudinary image resources during the build. The current library uses:

```text
analog/
  analog/odyssey
  analog/slayyy
digital/
```

`photosHandler.ts` still validates against hardcoded roots (`analog`, `digital`) for security, but the manifest generator discovers all root folders dynamically from the Cloudinary folder structure. The build-time manifest generator writes `src/data/photoManifest.json` with only leaf folders (no parent aggregation).

## Gallery layout and image delivery

The Gallery is an internal scroll container. Its grid is three columns on desktop and one column below the mobile breakpoint. Each thumbnail frame is square.

Gallery thumbnails use centered square Cloudinary crops:

```text
c_fill,g_center,w_...,h_...
```

This is important because `object-fit: cover` alone can make very wide source images blurry if Cloudinary first delivers an aspect-ratio-preserving, shallow image. Responsive candidates are currently 200, 400, and 800 pixels, selected through `srcSet` and `sizes`.

The Lightbox uses separate aspect-ratio-preserving `c_limit` transformations sized according to the available viewport/layout. Gallery and Lightbox transformations should not be casually merged: their aspect-ratio and sizing requirements are different.

## Metadata loading and pagination

Photo metadata is embedded in the build-time manifest (`src/data/photoManifest.json`) as:

- `photosByFolder`: a map from folder path to the photos that live directly in that folder. Each photo appears exactly once, keyed by the folder path where it lives. There is no `allPhotos` field and no parent-child duplication. Photos in `analog/odyssey/` appear only in `photosByFolder["analog/odyssey"]`, never also aggregated into `photosByFolder["analog"]`. A root folder like `digital` can have its own entry if it has direct photos.
- `roots` and `albums`: navigation arrays derived from the folder structure (auto-discovered from Cloudinary, not hardcoded).

The "Todas" (All) view is computed at runtime as `Object.values(photosByFolder).flat()`. Root folder views (e.g., "Analógicas") filter by prefix (`folder === 'analog' || folder.startsWith('analog/')`). Specific album views use direct lookup.

Both the build-time validator (`scripts/validate-photo-manifest.mjs`) and the runtime validator (`usePhotos.validateManifest`) enforce that each photo appears exactly once (no duplicate publicIds within or across folders).

`usePhotos` loads the appropriate array synchronously based on the selected folder (or the "All" view). There is no runtime network request for metadata during normal browsing.

Pagination is client-side array slicing in PAGE_SIZE batches (12 photos per page). The `loadMore` function uses `flushSync` from `react-dom` to force a synchronous render of the loading skeleton before photo updates, ensuring the loading state is always visible despite React's automatic batching.

The mount effect uses `queueMicrotask` to populate the manifest data, allowing React to render the loading skeleton on initial mount and folder switches before the data is exposed.

The `photosHandler` Netlify function and `fetchPhotos` utility are retained but unused during normal browsing. They exist as the server-side Cloudinary credential boundary for potential webhook flows or debugging.

The `retry` callback is now a no-op kept for interface compatibility, since there are no transient failures to retry in the synchronous pagination model.

## Lightbox layers

The Lightbox is a fixed full-screen dialog with these conceptual layers:

```text
Lightbox
├── current-photo blurred background
├── readability scrim
├── close button
├── stable content viewport
│   ├── sliding foreground photo panels
│   ├── mobile poem toggle
│   └── desktop/mobile poem content
└── desktop navigation container
```

The current background uses a small Cloudinary image enlarged with CSS blur and crossfades when the photo changes. The foreground photo panels use keyed `AnimatePresence` children and directional horizontal transitions. Background and foreground intentionally have separate animation systems at present.

On desktop, the poem is an absolutely positioned side panel. When a poem exists, the image container reserves the poem panel’s width internally so the foreground slide still begins at the full viewport edge without rendering beneath the poem.

On mobile, the poem is not part of normal image layout. A BookOpen toggle appears for photos with poems. The poem opens as an absolute, full-viewport, independently scrollable overlay. Touch events inside it are stopped from reaching the swipe handler.

## Styling and motion

Styles are CSS Modules. Motion uses the `motion/react` package. `prefers-reduced-motion` is respected in component transitions and CSS animations. Transform and opacity are the preferred animated properties, but visual experiments should be validated on Firefox and mobile browsers as well as Chromium.

## Important boundaries

- Keep Cloudinary credentials in Netlify-only code.
- Keep generated `src/data/photoManifest.json` build-owned; do not hand-edit it unless intentionally testing.
- Keep local poem keys synchronized with exact photo `publicId` values.
- Preserve the distinction between Gallery thumbnail transforms and Lightbox transforms.
- Avoid changing unrelated formatting or discarding user work in a dirty worktree.
