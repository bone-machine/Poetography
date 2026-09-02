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
- Display a clear retry action when the initial metadata request fails.
- Keep already-loaded photos visible when a pagination request fails.
- Retry transient pagination failures automatically before exposing a subtle manual retry link.

### Filters and albums

- Provide an “All” filter.
- Provide filters for the `analog` and `digital` roots.
- Provide filters for discovered nested Cloudinary folders.
- Treat folder paths as data, not as arbitrary executable input.
- Generate album navigation data during the build from Cloudinary metadata.

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

- Abort stale metadata requests when the selected folder changes or an initial retry starts.
- Ignore responses belonging to an obsolete request even if cancellation races with completion.
- Cache photo metadata separately by folder and cache version.
- Use a finite cache lifetime.
- Do not expose Cloudinary API credentials in browser code.
- Handle Cloudinary/API/network failures with appropriate initial-load and pagination states.

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
