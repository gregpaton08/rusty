// import '../styles/style.css';

const backendUrl = "/api"; // Rust backend URL
const image_size = window.innerWidth <= 640 ? 'small'
  : window.innerWidth <= 1280 ? 'medium'
    : window.innerWidth <= 1920 ? 'large'
      : 'original';
const imageUrl = `${backendUrl}/image/${image_size}/`;

let images: string[] = [];
let preloaded: HTMLImageElement[] = [];
let currentFrame: number = 0;
let playing: boolean = false;
let interval: number | null = null;
let touchStartX: number = 0;
let touchStartY: number = 0;

const imgElement = document.getElementById("timelapse") as HTMLImageElement;
const container = document.getElementById("timelapseContainer") as HTMLDivElement;

async function loadImages(): Promise<void> {
    try {
        const response = await fetch(`${backendUrl}/images`);
        images = await response.json();
        if (images.length > 0) {
            // Preload all images
            preloaded = images.map(name => {
                const img = new Image();
                img.src = `${imageUrl}/${name}`;
                return img;
            });
            imgElement.src = preloaded[0].src;
            imgElement.onload = hideAddressBar;
        }
    } catch (error) {
        console.error("Failed to load images:", error);
    }
}

function showFrame(frame: number): void {
    imgElement.src = preloaded[frame].src;
}

function nextFrame(): void {
    if (preloaded.length === 0) return;
    currentFrame = (currentFrame + 1) % preloaded.length;
    showFrame(currentFrame);
}

function prevFrame(): void {
    if (preloaded.length === 0) return;
    currentFrame = (currentFrame - 1 + preloaded.length) % preloaded.length;
    showFrame(currentFrame);
}

function togglePlay(): void {
    if (playing) {
        if (interval) clearInterval(interval);
    } else {
        interval = setInterval(nextFrame, 100); // Adjust speed as needed
    }
    playing = !playing;
}

function handleClick(event: MouseEvent): void {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    
    // Left third of the image
    if (x < width / 3) {
        if (playing) togglePlay(); // Pause if playing
        prevFrame();
    }
    // Right third of the image
    else if (x > (width * 2) / 3) {
        if (playing) togglePlay(); // Pause if playing
        nextFrame();
    }
    // Center third of the image
    else {
        togglePlay();
    }
}

function handleTouchStart(event: TouchEvent): void {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

function handleTouchEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;

    // Only count as swipe if horizontal movement > 30px and dominates vertical
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
        event.preventDefault();
        if (playing) togglePlay();
        if (dx < 0) {
            nextFrame(); // Swipe left → next
        } else {
            prevFrame(); // Swipe right → prev
        }
    }
}

container.addEventListener("click", handleClick);
container.addEventListener("touchstart", handleTouchStart, { passive: true });
container.addEventListener("touchend", handleTouchEnd);

// Load images on startup
loadImages();
// Automatically play the timelapse
togglePlay();

// Add this function after your existing function declarations
function hideAddressBar(): void {
    // iOS Safari specific
    if ('standalone' in window.navigator && !window.navigator['standalone']) {
        // Add a slight delay to ensure DOM is ready
        setTimeout(() => {
            window.scrollTo(0, 1);
        }, 50);
    }
}

// Add event listener for orientation changes
window.addEventListener('resize', hideAddressBar);
window.addEventListener('orientationchange', hideAddressBar);
