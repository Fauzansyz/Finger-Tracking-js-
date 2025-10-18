const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Mapping jari: [tip, pip/sesudahnya] + huruf
// text bisa di ganti sama kalian 
const fingerData = {
    8: [6, 'Aku'], // telunjuk
    12: [10, 'Fauzan'], // jari tengah
    16: [14, ''], // jari manis
    20: [18, ''], // kelingking
    4: [3, 'Hai'] // ibu jari
};

function onResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.image) {
        const videoWidth = results.image.width;
        const videoHeight = results.image.height;
        const scale = Math.min(canvas.width / videoWidth, canvas.height / videoHeight);
        const offsetX = (canvas.width - videoWidth * scale) / 2;
        const offsetY = (canvas.height - videoHeight * scale) / 2;
        
        ctx.save();
        ctx.translate(canvas.width, 0); // mirror X
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, offsetX, offsetY, videoWidth * scale, videoHeight * scale);
        ctx.restore();
        
        if (results.multiHandLandmarks) {
            results.multiHandLandmarks.forEach(hand => {
                for (const [tipIdx, [pipIdx, letter]] of Object.entries(fingerData)) {
                    const tip = hand[tipIdx];
                    const pip = hand[pipIdx];
                    
                    // cek jari diangkat
                    let isUp = false;
                    if (tipIdx != 4) { // jari bukan ibu jari
                        isUp = tip.y < pip.y;
                    } else { // ibu jari horizontal
                        isUp = tip.x > pip.x; // kanan tangan
                    }
                    
                    if (isUp) {
                        const x = canvas.width - (tip.x * videoWidth * scale + offsetX);
                        const y = tip.y * videoHeight * scale + offsetY;
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 28px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        ctx.fillText(letter, x, y - 10);
                    }
                }
            });
        }
    }
}

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