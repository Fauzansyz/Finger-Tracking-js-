const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let model;

// Asumsi referensi: lebar telapak tangan ~8 cm
const REF_WIDTH_CM = 8;

const video = document.createElement('video');
video.autoplay = true;
video.playsInline = true;

// Pakai kamera belakang
navigator.mediaDevices.getUserMedia({video: { facingMode: "environment" }})
.then(stream => video.srcObject = stream);

// Load model COCO-SSD
cocoSsd.load().then(m => {
    model = m;
    detectFrame();
});

function detectFrame(){
    if(!model || !video.videoWidth) return requestAnimationFrame(detectFrame);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const scale = Math.min(canvas.width/video.videoWidth, canvas.height/video.videoHeight);
    const offsetX = (canvas.width - video.videoWidth*scale)/2;
    const offsetY = (canvas.height - video.videoHeight*scale)/2;

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(video, offsetX, offsetY, video.videoWidth*scale, video.videoHeight*scale);

    model.detect(video).then(predictions=>{
        predictions.forEach(pred=>{
            const [x,y,width,height] = pred.bbox;

            // konversi ke canvas scale
            const cx = x*scale + offsetX;
            const cy = y*scale + offsetY;
            const w = width*scale;
            const h = height*scale;

            // hitung ukuran dalam cm (kasar, bisa kalibrasi)
            const pxToCm = REF_WIDTH_CM / 100; // contoh asumsi 100px = 8cm
            const wCm = w*pxToCm;
            const hCm = h*pxToCm;

            // gambar bounding box
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 3;
            ctx.strokeRect(cx, cy, w, h);

            // tulis nama + ukuran
            ctx.fillStyle = 'yellow';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign='left';
            ctx.fillText(`${pred.class} ${wCm.toFixed(1)}x${hCm.toFixed(1)} cm`, cx, cy-5);
        });
    });

    requestAnimationFrame(detectFrame);
}

window.addEventListener('resize', ()=>{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});