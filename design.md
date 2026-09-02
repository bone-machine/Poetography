# Poetography design

## Overview

The application is a React 19 + TypeScript + Vite frontend deployed to Netlify. Netlify Functions provide the server-side Cloudinary metadata boundary. Cloudinary serves the actual image assets and dynamically transformed variants.

## Data flow

```text
App filter state
        ↓
usePhotos(folder)
        ↓
Netlify photosHandler
        ↓
Cloudinary Search API
        ↓
Photo metadata pages
        ↓
Gallery → Lightbox
```

`App.tsx` owns the selected folder. `usePhotos` owns metadata loading, caching, pagination, retries, and request cancellation. `Gallery` owns the scrollable presentation and selection. `Lightbox` owns photo navigation and poem presentation.

## Cloudinary organization

The supported roots are:

```text
analog/
digital/
```

Nested folders are supported, for example:

```text
analog/odyssey
analog/fomapan200_april_2023
digital/some-future-album
```

`photosHandler.ts` accepts only supported roots and safe path segments. Root queries include nested folders. The build-time manifest generator discovers folders from all Cloudinary image resources and writes `src/data/albums.json`.

## Gallery layout and image delivery

The Gallery is an internal scroll container. Its grid is three columns on desktop and one column below the mobile breakpoint. Each thumbnail frame is square.

Gallery thumbnails use centered square Cloudinary crops:

```text
c_fill,g_center,w_...,h_...
```

This is important because `object-fit: cover` alone can make very wide source images blurry if Cloudinary first delivers an aspect-ratio-preserving, shallow image. Responsive candidates are currently 200, 400, and 800 pixels, selected through `srcSet` and `sizes`.

The Lightbox uses separate aspect-ratio-preserving `c_limit` transformations sized according to the available viewport/layout. Gallery and Lightbox transformations should not be casually merged: their aspect-ratio and sizing requirements are different.

## Metadata cache and pagination

The cache is stored in `localStorage` under a versioned key containing the selected folder. Each cache entry stores:

```text
version
timestamp
data: Photo[]
nextCursor
```

The first page can be displayed from cache while stale data is refreshed. Pagination appends to the current metadata list and updates the cache. A bottom `IntersectionObserver` sentinel requests the next cursor when it approaches the scroll viewport.

Initial failures replace the empty Gallery with a prominent retry state. Pagination failures leave current photos visible, retry transient failures twice automatically, and only then expose a small retry link.

Requests use both `AbortController` and a monotonically increasing request ID. Cancellation prevents unnecessary work; request identity prevents a late response from an old filter from updating the current Gallery.

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
- Keep generated `src/data/albums.json` build-owned; do not hand-edit it unless intentionally testing.
- Keep local poem keys synchronized with exact photo `publicId` values.
- Preserve the distinction between Gallery thumbnail transforms and Lightbox transforms.
- Avoid changing unrelated formatting or discarding user work in a dirty worktree.
