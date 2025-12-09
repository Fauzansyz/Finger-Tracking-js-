const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Asumsi: lebar telapak ~8 cm, digunakan untuk scaling
const PALM_REAL_WIDTH_CM = 8;

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.image) {
        const videoWidth = results.image.width;
        const videoHeight = results.image.height;
        const scale = Math.min(canvas.width / videoWidth, canvas.height / videoHeight);
        const offsetX = (canvas.width - videoWidth * scale) / 2;
        const offsetY = (canvas.height - videoHeight * scale) / 2;
        
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, offsetX, offsetY, videoWidth * scale, videoHeight * scale);
        ctx.restore();
        
        if (results.multiHandLandmarks) {
            results.multiHandLandmarks.forEach(hand => {
                const thumb = hand[4];
                const index = hand[8];
                
                const xThumb = canvas.width - (thumb.x * videoWidth * scale + offsetX);
                const yThumb = thumb.y * videoHeight * scale + offsetY;
                
                const xIndex = canvas.width - (index.x * videoWidth * scale + offsetX);
                const yIndex = index.y * videoHeight * scale + offsetY;
                
                // estimasi lebar telapak
                const wrist = hand[0];
                const pinkyMCP = hand[17];
                const palmWidthPx = distance(
                    canvas.width - (wrist.x * videoWidth * scale + offsetX),
                    wrist.y * videoHeight * scale + offsetY,
                    canvas.width - (pinkyMCP.x * videoWidth * scale + offsetX),
                    pinkyMCP.y * videoHeight * scale + offsetY
                );
                
                const pxToCm = PALM_REAL_WIDTH_CM / palmWidthPx;
                
                // hitung jarak jempol-telunjuk dalam cm
                const distPx = distance(xThumb, yThumb, xIndex, yIndex);
                const distCm = distPx * pxToCm;
                
                // gambar garis
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(xThumb, yThumb);
                ctx.lineTo(xIndex, yIndex);
                ctx.stroke();
                
                // tampilkan jarak cm
                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(distCm.toFixed(1) + ' cm', (xThumb + xIndex) / 2, (yThumb + yIndex) / 2 - 10);
            });
        }
    }
}

// MediaPipe Hands setup (sama seperti sebelumnya)
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const video = document.createElement('video');
video.autoplay = true;
video.playsInline = true;

const camera = new Camera(video, {
    onFrame: async () => { await hands.send({ image: video }); },
    width: canvas.width,
    height: canvas.height
});
camera.start();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});


