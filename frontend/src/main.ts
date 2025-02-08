// import '../styles/style.css';

const backendUrl = "/api"; // Rust backend URL
const image_size = window.innerWidth <= 640 ? 'small'
  : window.innerWidth <= 1280 ? 'medium'
    : window.innerWidth <= 1920 ? 'large'
      : 'original';
const imageUrl = `${backendUrl}/image/${image_size}/`;

let images: string[] = [];
let currentFrame: number = 0;
let playing: boolean = false;
let interval: number | null = null;

const imgElement = document.getElementById("timelapse") as HTMLImageElement;
const container = document.getElementById("timelapseContainer") as HTMLDivElement;

async function loadImages(): Promise<void> {
    try {
        const response = await fetch(`${backendUrl}/images`);
        images = await response.json();
        if (images.length > 0) {
            imgElement.src = `${imageUrl}/${images[0]}`;
        }
    } catch (error) {
        console.error("Failed to load images:", error);
    }
}

function nextFrame(): void {
    if (images.length === 0) return;

    currentFrame = (currentFrame + 1) % images.length; // Loop back to start
    imgElement.src = `${imageUrl}/${images[currentFrame]}`;
}

function prevFrame(): void {
    if (images.length === 0) return;

    currentFrame = (currentFrame - 1 + images.length) % images.length; // Loop backward
    imgElement.src = `${imageUrl}/${images[currentFrame]}`;
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

// Add new event listener
container.addEventListener("click", handleClick);

// Load images on startup
loadImages();
// Automatically play the timelapse
togglePlay();
