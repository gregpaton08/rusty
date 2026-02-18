  1. Preload images — Currently each frame is fetched on demand, causing flicker/delays. You could preload all images into   
  memory so playback is smooth:                                                                                            
  const preloaded: HTMLImageElement[] = [];                                                                                  
  images.forEach(name => {                                                                                                 
      const img = new Image();
      img.src = `${imageUrl}/${name}`;
      preloaded.push(img);
  });
  // Then swap imgElement.src from the preloaded cache

  2. Progress indicator — There's no visual feedback about where you are in the timelapse. A thin progress bar at the bottom
  or a frame counter (e.g. 42/300) would help orient the viewer.

  3. Playback speed control — The 100ms interval is hardcoded. Adding keyboard or swipe controls to speed up/slow down would
  be useful (e.g. 50ms, 100ms, 200ms, 500ms).

  4. Keyboard controls — No keyboard support exists. Arrow keys for prev/next, spacebar for play/pause would make it usable
  on desktop.

  5. Loading state — If images are slow to load, the user sees nothing. A loading spinner or "Loading..." text while
  loadImages() runs would help.

  6. Image size on resize — image_size is set once at page load. If the user rotates their phone or resizes their browser,
  they're stuck with the original size choice. You could recalculate on resize and refetch.

  7. Touch gestures — The click-zone approach works but swipe left/right would feel more natural on mobile for prev/next. You
   could also add swipe up/down for speed control.

  8. Black background — The default white background flashes between frames. Setting background: black on the body would look
   better for photo content.