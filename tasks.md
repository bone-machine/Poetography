# Poetography tasks

This is a lightweight project backlog. Completed items are retained as context; open items should be reviewed before starting new work.

## Completed

- [x] Build the responsive Gallery with an internal scroll container.
- [x] Add three-column desktop and single-column mobile layouts.
- [x] Add square thumbnail frames and centered Cloudinary thumbnail crops.
- [x] Add Gallery skeletons and initial-load error/retry state.
- [x] Add cursor-based pagination through an IntersectionObserver sentinel.
- [x] Add folder-separated local metadata caching with TTL and cache versioning.
- [x] Keep cached photos visible when a refresh fails.
- [x] Add automatic transient pagination retries and a subtle manual retry link.
- [x] Add AbortController and request identity protection for stale metadata requests.
- [x] Generate an album manifest during the build.
- [x] Add nested analog and digital album navigation.
- [x] Add keyed Lightbox photo panels with directional slide transitions.
- [x] Add desktop keyboard navigation and mobile swipe navigation.
- [x] Add desktop disabled navigation-arrow states.
- [x] Add the mobile full-viewport poem overlay and toggle button.
- [x] Add the Lightbox’s blurred current-photo background with a crossfade.

## Open investigations

- [ ] Investigate the sluggish Lightbox animation on first mount in Firefox and Samsung Internet.
  - Profile image decoding, CSS blur painting, layout measurement, and Motion layer creation separately.
  - Re-test the current implementation before introducing another optimization experiment.
  - Do not assume the reverted blurred-placeholder/decode experiment was the root cause.

- [ ] Verify the Lightbox background behavior on slow connections and when the background image fails.
  - Decide whether a neutral fallback or reuse of the foreground blurred placeholder is desirable.

- [ ] Verify the mobile poem overlay with long text, keyboard focus, safe-area insets, and repeated photo changes.

- [ ] Test pagination under delayed, aborted, rate-limited, and server-error responses.

## Possible future improvements

- [ ] Add tests for photo-cache validation and request race conditions.
- [ ] Add a small test/demo mechanism for forcing initial-load and pagination failures without editing production code.
- [ ] Consider a more accurate responsive `sizes` value if the Gallery width/layout changes.
- [ ] Consider persistent album-manifest caching only if build-time generation or request volume becomes a concern.
- [ ] Add explicit Cloudinary focal-point metadata if centered thumbnail crops are unsuitable for particular compositions.
- [ ] Consider prefetching Lightbox background variants separately, but measure whether the additional delivery requests are worthwhile.
- [ ] Improve focus management when opening and closing the Lightbox.
- [ ] Add a visible loading state or transition policy for the first Lightbox image if first-mount animation profiling identifies image decode contention.
