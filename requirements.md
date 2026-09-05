# Poetography requirements

## Product purpose

Poetography is a photographic portfolio. It presents curated digital and analog photography, supports nested albums, and associates selected photographs with poems.

## Functional requirements

### Gallery

- Display photos in a responsive gallery.
- Use three columns on desktop and one photo per row on mobile.
- Keep the main application viewport fixed while allowing vertical scrolling inside the Gallery.
- Display square thumbnails with consistent dimensions.
- Crop thumbnails without distortion and center the crop.
- Show loading skeletons while photo metadata or additional pages are loading.
- Open a selected photo in the Lightbox.
- Load photos incrementally as the user approaches the bottom of the Gallery.
- Ensure the loading skeleton is always visible during pagination by using `flushSync` from `react-dom` to force a synchronous render before photo updates. This prevents React's automatic batching from hiding the loading state.
- Use a no-op retry action kept for interface compatibility, since the synchronous pagination model has no transient failures to retry.

### Filters and albums

- Provide an "All" filter.
- Provide filters for the `analog` and `digital` roots.
- Provide filters for discovered nested Cloudinary folders.
- Treat folder paths as data, not as arbitrary executable input.
- Generate album navigation data during the build from Cloudinary metadata.
- Auto-discover root folders from Cloudinary during the build; do not hardcode folder names.
- The `photosByFolder` map contains an entry for every folder path that has photos directly in it. No entry aggregates photos from child folders — there is no parent-child duplication. For example, photos in `analog/odyssey/` appear only in `photosByFolder["analog/odyssey"]`, never also in `photosByFolder["analog"]`. A root folder like `digital` can have its own entry if it has direct photos. The "All" view is computed at runtime by flattening `photosByFolder`. Root folder views filter by prefix (`folder === root || folder.startsWith(root + '/')`).

### Lightbox

- Display the selected photo in a full-screen modal.
- Support directional slide-in and slide-out transitions between photos.
- Support keyboard navigation and Escape-to-close on desktop.
- Support swipe navigation on mobile.
- Keep photo loading state isolated when the current photo changes.
- Show a blurred version of the current photo as the Lightbox background.
- Keep the background layer behind the image, controls, and poem content.
- Show desktop navigation arrows at all times, with disabled visual states at the first and last photos.
- Hide the desktop navigation container on mobile.
- Prefetch adjacent Lightbox photos where appropriate.

### Poems

- Match poems to photos by exact Cloudinary `publicId`.
- Display poems beside the image on desktop.
- Keep the desktop image viewport from extending beneath the poem panel.
- On mobile, keep the image viewport height stable and do not place poems below the image.
- Show a toggle button for mobile photos that have poems.
- Display the mobile poem in a full-viewport overlay with its own vertical scrolling.
- Prevent poem scrolling gestures from triggering photo navigation.
- Reset the mobile poem overlay when changing photos.

## Reliability requirements

- Do not expose Cloudinary API credentials in browser code.
- Validate the build-time manifest at build time with `scripts/validate-photo-manifest.mjs`. The validator checks version, roots, albums, photosByFolder structure, photo fields, and duplicate publicIds (within and across folders). A validation failure stops the build and prevents deployment.
- Validate the manifest at runtime in `usePhotos` with `validateManifest`. The runtime validator checks the same rules and surfaces failures as "Failed to load photos".
- Ensure each photo appears exactly once in the manifest (no duplicate publicIds). This is enforced by both validators.
- Fall back to an empty photo list for unknown folders rather than crashing.
- Keep the `photosHandler` Netlify function as the server-side Cloudinary credential boundary, retained for potential webhook flows or debugging.

## Accessibility and motion requirements

- Use semantic buttons for all interactive controls.
- Use native `disabled` state for unavailable desktop navigation arrows.
- Provide accessible labels for Lightbox controls and poem toggles.
- Respect `prefers-reduced-motion` for Motion and CSS animations.
- Do not allow decorative images to create unnecessary screen-reader content.

## Deployment requirements

- The frontend must build with Vite and TypeScript.
- Netlify must build the album manifest before compiling the frontend.
- Cloudinary credentials must be available to Netlify build/functions environments, never committed to the repository.
