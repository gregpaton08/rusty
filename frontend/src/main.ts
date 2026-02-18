// Configuration
const CONFIG = {
    BUFFER_AHEAD: 50,      // How many frames to keep loaded ahead
    BUFFER_BEHIND: 20,     // How many frames to keep loaded behind (for reverse)
    FPS: 8,                // Target playback speed
    SWIPE_THRESHOLD: 30,   // Pixels for touch swipe
};

// State
const backendUrl = "/api";
// Determine image size based on screen width
const imageSize = window.innerWidth <= 640 ? 'small'
    : window.innerWidth <= 1280 ? 'medium'
    : window.innerWidth <= 1920 ? 'large'
    : 'original';
const imageUrlBase = `${backendUrl}/image/${imageSize}/`;

let manifest: string[] = [];
// Cache: Map<FrameIndex, HTMLImageElement>
const imageCache = new Map<number, HTMLImageElement>(); 

let currentFrameIdx = 0;
let isPlaying = false;
let lastFrameTime = 0;
let animationFrameId: number | null = null;

// Touch State
let touchStartX = 0;
let touchStartY = 0;

// DOM Elements
const imgElement = document.getElementById("timelapse") as HTMLImageElement;
const container = document.getElementById("timelapseContainer") as HTMLDivElement;
// Optional: Add a simple loading div to your HTML if you want
const loadingIndicator = document.getElementById("loading") as HTMLDivElement | null;

// --- Core Logic ---

async function init() {
    try {
        const response = await fetch(`${backendUrl}/images`);
        if (!response.ok) throw new Error("Failed to fetch image list");
        
        manifest = await response.json();
        
        if (manifest.length > 0) {
            // Initial load: Buffer the first few images immediately
            updateBuffer(0);
            
            // Wait for the FIRST image specifically before showing anything
            const firstImg = new Image();
            firstImg.onload = () => {
                imgElement.src = firstImg.src;
                if(loadingIndicator) loadingIndicator.style.display = 'none';
                hideAddressBar();
                startPlayback(); 
            };
            firstImg.src = getImageUrl(0);
            imageCache.set(0, firstImg);
        }
    } catch (e) {
        console.error("Init failed:", e);
    }
}

function getImageUrl(index: number): string {
    return `${imageUrlBase}${manifest[index]}`;
}

/**
 * Ensures images around the currentIndex are loaded.
 * Removes images that are too far behind to save memory.
 */
function updateBuffer(centerIndex: number) {
    const total = manifest.length;
    
    // 1. Load Ahead
    for (let i = 0; i < CONFIG.BUFFER_AHEAD; i++) {
        const idx = (centerIndex + i) % total;
        if (!imageCache.has(idx)) {
            const img = new Image();
            img.src = getImageUrl(idx);
            imageCache.set(idx, img);
        }
    }

    // 2. Clean Behind (Garbage Collection)
    // We calculate the index that is 'BUFFER_BEHIND' frames behind us
    // If we have images older than that, we drop them.
    const cleanupThreshold = (centerIndex - CONFIG.BUFFER_BEHIND + total) % total;
    
    // Simple naive cleanup: Iterate map and delete anything not in window
    // (For very large maps, a circular buffer array is better, but Map is fine for <100 items)
    for (const key of imageCache.keys()) {
        // Calculate distance from current frame
        let dist = key - centerIndex;
        if (dist < 0) dist += total; // Handle wrapping
        
        // If it's not in the "keep" window (behind OR ahead), delete it
        if (dist > CONFIG.BUFFER_AHEAD && dist < (total - CONFIG.BUFFER_BEHIND)) {
            const imgToRemove = imageCache.get(key);
            if (imgToRemove) {
                imgToRemove.onload = null;
                imgToRemove.src = ""; // Help browser GC
            }
            imageCache.delete(key);
        }
    }
}

function renderFrame(index: number) {
    const cachedImage = imageCache.get(index);
    
    // Only swap the source if the image is actually loaded/complete
    // This prevents "white flashes" on slow connections
    if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
        imgElement.src = cachedImage.src;
        currentFrameIdx = index;
        updateBuffer(index); // Update our look-ahead buffer
    } else {
        // Frame not ready? 
        // Option A: Skip to next frame (catch up)
        // Option B: Wait (stutter) -> We will wait/stutter by doing nothing this frame
        console.debug(`Frame ${index} buffering...`);
    }
}

// --- Playback Loop ---

function loop(timestamp: number) {
    if (!isPlaying) return;

    // Calculate time elapsed since last frame
    const elapsed = timestamp - lastFrameTime;
    const interval = 1000 / CONFIG.FPS;

    if (elapsed > interval) {
        // Advance frame
        const nextIdx = (currentFrameIdx + 1) % manifest.length;
        renderFrame(nextIdx);
        
        // Adjust for processing time drift
        lastFrameTime = timestamp - (elapsed % interval);
    }

    animationFrameId = requestAnimationFrame(loop);
}

function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    lastFrameTime = performance.now();
    loop(lastFrameTime);
}

function stopPlayback() {
    isPlaying = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function togglePlay() {
    isPlaying ? stopPlayback() : startPlayback();
}

// --- Interaction Handlers ---

function nextFrame() {
    stopPlayback(); // Manual interaction stops auto-play
    const next = (currentFrameIdx + 1) % manifest.length;
    renderFrame(next);
}

function prevFrame() {
    stopPlayback();
    const prev = (currentFrameIdx - 1 + manifest.length) % manifest.length;
    renderFrame(prev);
}

function handleClick(event: MouseEvent) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) prevFrame();
    else if (x > (width * 2) / 3) nextFrame();
    else togglePlay();
}

function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > CONFIG.SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault(); // Prevent scroll
        stopPlayback(); // Stop playing on swipe
        if (dx < 0) nextFrame(); // Swipe Left -> Next
        else prevFrame();        // Swipe Right -> Prev
    }
}

function hideAddressBar() {
    if ('standalone' in window.navigator && !(window.navigator as any)['standalone']) {
        setTimeout(() => window.scrollTo(0, 1), 50);
    }
}

// --- Event Listeners ---

container.addEventListener("click", handleClick);
container.addEventListener("touchstart", handleTouchStart, { passive: false }); // passive: false needed for preventDefault
container.addEventListener("touchend", handleTouchEnd);
window.addEventListener('resize', hideAddressBar);

// Start
init();
