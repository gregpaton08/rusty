const backendUrl = "/api"; // Rust backend URL

let images: string[] = [];
let currentFrame: number = 0;
let playing: boolean = false;
let interval: number | null = null;

const imgElement = document.getElementById("timelapse") as HTMLImageElement;
const prevBtn = document.getElementById("prevBtn") as HTMLButtonElement;
const playPauseBtn = document.getElementById("playPauseBtn") as HTMLButtonElement;
const nextBtn = document.getElementById("nextBtn") as HTMLButtonElement;

async function loadImages(): Promise<void> {
    try {
        const response = await fetch(`${backendUrl}/images`);
        images = await response.json();
        if (images.length > 0) {
            imgElement.src = `${backendUrl}/timelapse/${images[0]}`;
        }
    } catch (error) {
        console.error("Failed to load images:", error);
    }
}

function nextFrame(): void {
    if (images.length === 0) return;

    currentFrame = (currentFrame + 1) % images.length; // Loop back to start
    imgElement.src = `${backendUrl}/timelapse/${images[currentFrame]}`;
}

function prevFrame(): void {
    if (images.length === 0) return;

    currentFrame = (currentFrame - 1 + images.length) % images.length; // Loop backward
    imgElement.src = `${backendUrl}/timelapse/${images[currentFrame]}`;
}

function togglePlay(): void {
    if (playing) {
        if (interval) clearInterval(interval);
    } else {
        interval = setInterval(nextFrame, 100); // Adjust speed as needed
    }
    playing = !playing;
}

// Attach event listeners
prevBtn.addEventListener("click", prevFrame);
playPauseBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextFrame);

// Load images on startup
loadImages();
// Automatically play the timelapse
togglePlay();
