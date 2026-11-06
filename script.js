/* ========================================================
   Trái Tim Nhịp Đập - Interactive Script
   ======================================================== */

// Cấu hình trạng thái (State)
const state = {
  bpm: 75,
  isSoundEnabled: false,
  soundTimer: null,
  audioCtx: null,
};

// Lấy các phần tử DOM
const heartSection = document.querySelector('.heart-section');
const heartWrapper = document.getElementById('heartWrapper');
const heartSvg = document.getElementById('heartSvg');
const bpmSlider = document.getElementById('bpmSlider');
const bpmSliderVal = document.getElementById('bpmSliderVal');
const bpmValueDisplay = document.getElementById('bpmValueDisplay');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundStatusText = document.getElementById('soundStatusText');
const themeButtons = document.querySelectorAll('.theme-btn');
const loveMessage = document.getElementById('loveMessage');

// ========================================================
// 1. Quản lý Tốc độ Nhịp Đập (BPM)
// ========================================================
function updateBPM(newBpm) {
  state.bpm = parseInt(newBpm, 10);
  const duration = (60 / state.bpm).toFixed(3);

  // Cập nhật CSS Variable cho toàn trang
  document.documentElement.style.setProperty('--beat-duration', `${duration}s`);

  // Cập nhật giao diện số
  bpmSlider.value = state.bpm;
  bpmSliderVal.textContent = state.bpm;
  bpmValueDisplay.textContent = state.bpm;

  // Khởi động lại vòng lặp âm thanh nếu đang bật
  if (state.isSoundEnabled) {
    restartHeartbeatAudioLoop();
  }
}

// Bắt sự kiện thanh trượt BPM
bpmSlider.addEventListener('input', (e) => {
  updateBPM(e.target.value);
});

// Kích hoạt class beating cho ripple effects
heartSection.classList.add('beating');

// ========================================================
// 2. Bộ Âm Thanh Nhịp Tim Chân Thực (Web Audio API)
// ========================================================
function initAudio() {
  if (!state.audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContext();
  }
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
}

// Hàm tổng hợp 1 tiếng đập đôi "thịch-thịch" (Lub-Dub)
function playThumpSound() {
  if (!state.audioCtx) return;
  const now = state.audioCtx.currentTime;

  // Lọc thông thấp để tiếng trầm đục như nghe qua ống nghe y tế
  const masterFilter = state.audioCtx.createBiquadFilter();
  masterFilter.type = 'lowpass';
  masterFilter.frequency.setValueAtTime(140, now);
  masterFilter.connect(state.audioCtx.destination);

  // --- Tiếng 1: LUB (Trầm, mạnh hơn) ---
  const osc1 = state.audioCtx.createOscillator();
  const gain1 = state.audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(65, now);
  osc1.frequency.exponentialRampToValueAtTime(32, now + 0.14);

  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(0.8, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc1.connect(gain1);
  gain1.connect(masterFilter);
  osc1.start(now);
  osc1.stop(now + 0.18);

  // --- Tiếng 2: DUB (Cao hơn một chút, ngắn hơn) ---
  const dubDelay = 0.14; // khoảng cách giữa 2 nhịp
  const osc2 = state.audioCtx.createOscillator();
  const gain2 = state.audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(75, now + dubDelay);
  osc2.frequency.exponentialRampToValueAtTime(38, now + dubDelay + 0.12);

  gain2.gain.setValueAtTime(0.001, now + dubDelay);
  gain2.gain.linearRampToValueAtTime(0.6, now + dubDelay + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + dubDelay + 0.14);

  osc2.connect(gain2);
  gain2.connect(masterFilter);
  osc2.start(now + dubDelay);
  osc2.stop(now + dubDelay + 0.16);
}

function startHeartbeatAudioLoop() {
  stopHeartbeatAudioLoop();
  const intervalMs = (60 / state.bpm) * 1000;
  playThumpSound();
  state.soundTimer = setInterval(() => {
    playThumpSound();
  }, intervalMs);
}

function stopHeartbeatAudioLoop() {
  if (state.soundTimer) {
    clearInterval(state.soundTimer);
    state.soundTimer = null;
  }
}

function restartHeartbeatAudioLoop() {
  stopHeartbeatAudioLoop();
  startHeartbeatAudioLoop();
}

// Bật/Tắt nút âm thanh
soundToggleBtn.addEventListener('click', () => {
  initAudio();
  state.isSoundEnabled = !state.isSoundEnabled;

  if (state.isSoundEnabled) {
    soundToggleBtn.classList.add('active');
    soundStatusText.textContent = 'Tắt âm thanh';
    startHeartbeatAudioLoop();
  } else {
    soundToggleBtn.classList.remove('active');
    soundStatusText.textContent = 'Bật âm thanh';
    stopHeartbeatAudioLoop();
  }
});

// ========================================================
// 3. Canvas Hạt Nền Bay Lơ Lửng (Starry Hearts & Glow)
// ========================================================
const particleCanvas = document.getElementById('particleCanvas');
const pCtx = particleCanvas.getContext('2d');
let particles = [];
let burstParticles = [];

function resizeParticleCanvas() {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeParticleCanvas);
resizeParticleCanvas();

// Lớp hạt bay nền
class FloatingParticle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * particleCanvas.width;
    this.y = particleCanvas.height + Math.random() * 50;
    this.size = Math.random() * 8 + 3;
    this.speedY = Math.random() * 0.8 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.isHeart = Math.random() > 0.4;
    this.rotation = (Math.random() - 0.5) * 0.5;
    this.angle = Math.random() * Math.PI * 2;
  }

  update() {
    this.y -= this.speedY;
    this.x += this.speedX + Math.sin(this.y * 0.02) * 0.3;
    this.angle += this.rotation * 0.05;

    if (this.y < -30) {
      this.reset();
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = this.opacity;

    const currentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#ff1744';

    if (this.isHeart) {
      ctx.fillStyle = currentPrimary;
      drawMiniHeart(ctx, 0, 0, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = currentPrimary;
      ctx.fill();
    }
    ctx.restore();
  }
}

// Hạt nổ bùng khi nhấn vào trái tim
class BurstHeart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1.5;
    this.gravity = 0.08;
    this.size = Math.random() * 12 + 8;
    this.opacity = 1;
    this.decay = Math.random() * 0.015 + 0.012;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.rotation += this.rotSpeed;
    this.opacity -= this.decay;
  }

  draw(ctx) {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = Math.max(0, this.opacity);

    const currentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#ff1744';
    ctx.fillStyle = currentPrimary;
    ctx.shadowBlur = 10;
    ctx.shadowColor = currentPrimary;

    drawMiniHeart(ctx, 0, 0, this.size);
    ctx.restore();
  }
}

// Vẽ hình trái tim nhỏ trên Canvas
function drawMiniHeart(ctx, x, y, size) {
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  // Cung trái
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  // Đáy nhọn
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
  // Đáy sang cung phải
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  // Vòng về trên
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();
}

// Khởi tạo các hạt nền
for (let i = 0; i < 45; i++) {
  const p = new FloatingParticle();
  p.y = Math.random() * window.innerHeight;
  particles.push(p);
}

function animateParticles() {
  pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

  // Cập nhật & vẽ hạt nền
  particles.forEach(p => {
    p.update();
    p.draw(pCtx);
  });

  // Cập nhật & vẽ hạt bùng nổ khi click
  for (let i = burstParticles.length - 1; i >= 0; i--) {
    const bp = burstParticles[i];
    bp.update();
    bp.draw(pCtx);
    if (bp.opacity <= 0) {
      burstParticles.splice(i, 1);
    }
  }

  requestAnimationFrame(animateParticles);
}
requestAnimationFrame(animateParticles);

// ========================================================
// 4. Đường Điện Tim (ECG / EKG Pulse Monitor)
// ========================================================
const ecgCanvas = document.getElementById('ecgCanvas');
const ecgCtx = ecgCanvas.getContext('2d');
let ecgOffset = 0;

function resizeEcgCanvas() {
  const rect = ecgCanvas.getBoundingClientRect();
  ecgCanvas.width = rect.width || window.innerWidth;
  ecgCanvas.height = rect.height || 120;
}
window.addEventListener('resize', resizeEcgCanvas);
resizeEcgCanvas();

// Tính dạng sóng ECG chuẩn (Sóng P, Q, R nhọn, S, T)
function getEcgY(t) {
  // t từ 0 đến 1 trong 1 chu kỳ nhịp tim
  const phase = t % 1.0;
  const h = ecgCanvas.height / 2;

  // Đường cơ sở
  if (phase < 0.15) {
    return h;
  }
  // Sóng P (nhẹ)
  if (phase >= 0.15 && phase < 0.25) {
    const p = (phase - 0.15) / 0.10;
    return h - Math.sin(p * Math.PI) * (h * 0.22);
  }
  // Đoạn PR phẳng
  if (phase >= 0.25 && phase < 0.32) {
    return h;
  }
  // Phức hợp QRS (Q xuống nhẹ, R nhọn vút cao, S xuống sâu)
  if (phase >= 0.32 && phase < 0.35) {
    // Sóng Q
    const q = (phase - 0.32) / 0.03;
    return h + Math.sin(q * Math.PI) * (h * 0.15);
  }
  if (phase >= 0.35 && phase < 0.40) {
    // Sóng R nhọn cực điểm
    const r = (phase - 0.35) / 0.05;
    return h - Math.sin(r * Math.PI) * (h * 0.85);
  }
  if (phase >= 0.40 && phase < 0.44) {
    // Sóng S xuống
    const s = (phase - 0.40) / 0.04;
    return h + Math.sin(s * Math.PI) * (h * 0.3);
  }
  // Đoạn ST phẳng
  if (phase >= 0.44 && phase < 0.50) {
    return h;
  }
  // Sóng T (nhẹ)
  if (phase >= 0.50 && phase < 0.65) {
    const tWave = (phase - 0.50) / 0.15;
    return h - Math.sin(tWave * Math.PI) * (h * 0.35);
  }
  // Nghỉ
  return h;
}

function animateEcg() {
  const w = ecgCanvas.width;
  const h = ecgCanvas.height;

  ecgCtx.clearRect(0, 0, w, h);

  const currentPrimary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#ff1744';

  ecgCtx.lineWidth = 2.5;
  ecgCtx.strokeStyle = currentPrimary;
  ecgCtx.shadowColor = currentPrimary;
  ecgCtx.shadowBlur = 10;
  ecgCtx.lineJoin = 'round';
  ecgCtx.beginPath();

  // Tốc độ di chuyển sóng tỉ lệ với BPM
  const speed = (state.bpm / 60) * 0.005;
  ecgOffset = (ecgOffset + speed) % 1.0;

  for (let x = 0; x < w; x++) {
    // Ánh xạ tọa độ x thành pha sóng (chu kỳ xuất hiện mỗi 280px)
    const t = (x / 280) - ecgOffset;
    const y = getEcgY((t % 1 + 1) % 1);

    if (x === 0) {
      ecgCtx.moveTo(x, y);
    } else {
      ecgCtx.lineTo(x, y);
    }
  }
  ecgCtx.stroke();

  requestAnimationFrame(animateEcg);
}
requestAnimationFrame(animateEcg);

// ========================================================
// 5. Tương Tác Khi Nhấp Vào Trái Tim (Click / Tap Burst)
// ========================================================
function triggerHeartInteraction(e) {
  // Lấy toạ độ chạm hoặc click
  let clientX, clientY;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  // Nếu nhấp vào wrapper mà không có toạ độ chính xác, lấy giữa tim
  if (!clientX || !clientY) {
    const rect = heartSvg.getBoundingClientRect();
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }

  // Bùng nổ hạt trái tim nhỏ
  for (let i = 0; i < 28; i++) {
    burstParticles.push(new BurstHeart(clientX, clientY));
  }

  // Âm thanh đập khi nhấp
  initAudio();
  playThumpSound();

  // Hiệu ứng nảy trái tim
  heartWrapper.classList.add('heart-clicked');
  setTimeout(() => {
    heartWrapper.classList.remove('heart-clicked');
  }, 180);
}

heartWrapper.addEventListener('click', triggerHeartInteraction);
heartWrapper.addEventListener('touchstart', (e) => {
  triggerHeartInteraction(e);
}, { passive: true });

// ========================================================
// 6. Đổi Bộ Giao Diện Màu Sắc (Themes)
// ========================================================
themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    themeButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const themeName = btn.dataset.themeName;
    document.body.dataset.theme = themeName;
    localStorage.setItem('heartTheme', themeName);
  });
});

// Khôi phục chủ đề đã lưu
const savedTheme = localStorage.getItem('heartTheme');
if (savedTheme) {
  document.body.dataset.theme = savedTheme;
  themeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeName === savedTheme);
  });
}

// ========================================================
// 7. Lưu Trữ Lời Nhắn Tình Yêu (LocalStorage)
// ========================================================
const savedMsg = localStorage.getItem('heartLoveMessage');
if (savedMsg) {
  loveMessage.innerText = savedMsg;
}

loveMessage.addEventListener('input', () => {
  localStorage.setItem('heartLoveMessage', loveMessage.innerText);
});

// Khởi chạy BPM mặc định
updateBPM(75);
