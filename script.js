const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const restartBtn = document.getElementById('restart-btn');
const recordsBtn = document.getElementById('records-btn');
const userDisplay = document.getElementById('current-user-display');
const themeToggle = document.getElementById('theme-toggle');

const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const usernameSaveBtn = document.getElementById('username-save-btn');

const recordsModal = document.getElementById('records-modal');
const recordsList = document.getElementById('records-list');
const noRecordsMsg = document.getElementById('no-records-msg');
const recordsCloseBtn = document.getElementById('records-close-btn');

const newRecordModal = document.getElementById('new-record-modal');
const newRecordName = document.getElementById('new-record-name');
const newRecordScore = document.getElementById('new-record-score');
const newRecordCloseBtn = document.getElementById('new-record-close-btn');

const confettiLayer = document.getElementById('confetti-layer');

const SIZE = 20;
const COLS = canvas.width / SIZE;
const ROWS = canvas.height / SIZE;

let snake, food, direction, nextDirection, score, highScore, gameOver, paused, loopId;
let username = '';
let confettiPieces = [];
let confettiAnimId = null;

// --- Theme ---
function loadTheme() {
  const saved = localStorage.getItem('snake_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggle.textContent = saved === 'dark' ? '🌙' : '☀️';
  return saved;
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('snake_theme', next);
  themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
}

themeToggle.addEventListener('click', toggleTheme);
loadTheme();

// --- User ---
function loadUser() {
  const saved = localStorage.getItem('snake_user');
  if (saved) {
    username = saved;
    userDisplay.textContent = '👤 ' + username;
    return true;
  }
  return false;
}

function saveUser(name) {
  username = name.trim();
  localStorage.setItem('snake_user', username);
  userDisplay.textContent = '👤 ' + username;
}

if (!loadUser()) {
  usernameModal.classList.add('active');
  setTimeout(() => usernameInput.focus(), 100);
}

usernameSaveBtn.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (!name) { usernameInput.focus(); return; }
  saveUser(name);
  usernameModal.classList.remove('active');
});

usernameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') usernameSaveBtn.click();
});

// --- World Records ---
function getRecords() {
  try { return JSON.parse(localStorage.getItem('snake_records')) || []; }
  catch { return []; }
}

function saveRecords(records) {
  records.sort((a, b) => b.score - a.score);
  localStorage.setItem('snake_records', JSON.stringify(records.slice(0, 10)));
}

function renderRecords() {
  const records = getRecords();
  recordsList.innerHTML = '';
  if (records.length === 0) {
    noRecordsMsg.style.display = 'block';
    return;
  }
  noRecordsMsg.style.display = 'none';
  records.forEach((r, i) => {
    const li = document.createElement('li');
    const date = new Date(r.date).toLocaleDateString();
    li.innerHTML = `<span>${i + 1}. ${r.name}</span><span>${r.score} pts · ${date}</span>`;
    recordsList.appendChild(li);
  });
}

function checkWorldRecord(score) {
  const records = getRecords();
  const isWR = records.length === 0 || score > records[0].score;
  records.push({ name: username, score, date: new Date().toISOString() });
  saveRecords(records);
  if (isWR) {
    newRecordName.textContent = '🏆 ' + username + ' 🏆';
    newRecordScore.textContent = score + ' puntos';
    newRecordModal.classList.add('active');
    spawnConfetti(80);
  }
}

recordsBtn.addEventListener('click', () => {
  renderRecords();
  recordsModal.classList.add('active');
});

recordsCloseBtn.addEventListener('click', () => recordsModal.classList.remove('active'));

newRecordCloseBtn.addEventListener('click', () => newRecordModal.classList.remove('active'));

// --- Confetti ---
class Confetti {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 6 + Math.random() * 4;
    this.h = 4 + Math.random() * 3;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = -Math.random() * 8 - 3;
    this.g = 0.25;
    this.color = ['#ff4757', '#ffd700', '#00d4aa', '#ff6b81', '#7c5cfc', '#ffa502'][Math.floor(Math.random() * 6)];
    this.rot = Math.random() * 360;
    this.rotV = (Math.random() - 0.5) * 12;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.g;
    this.rot += this.rotV;
  }

  draw(parent) {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:${this.x}px;top:${this.y}px;width:${this.w}px;height:${this.h}px;background:${this.color};border-radius:2px;transform:rotate(${this.rot}deg);opacity:0.9`;
    parent.appendChild(el);
  }
}

function spawnConfetti(count) {
  const rect = canvas.getBoundingClientRect();
  const containerRect = confettiLayer.getBoundingClientRect();
  const cx = rect.left - containerRect.left + canvas.width / 2;
  const cy = rect.top - containerRect.top + canvas.height / 2;
  for (let i = 0; i < count; i++) {
    confettiPieces.push(new Confetti(cx + (Math.random() - 0.5) * 100, cy));
  }
  if (!confettiAnimId) animateConfetti();
}

function animateConfetti() {
  confettiLayer.innerHTML = '';
  confettiPieces = confettiPieces.filter(p => p.y < confettiLayer.offsetHeight + 50);
  confettiPieces.forEach(p => {
    p.update();
    p.draw(confettiLayer);
  });
  if (confettiPieces.length > 0) {
    confettiAnimId = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimId = null;
    confettiLayer.innerHTML = '';
  }
}

// --- Game ---
function init() {
  snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  gameOver = false;
  paused = false;
  highScore = parseInt(localStorage.getItem('snake_highscore')) || 0;
  highScoreEl.textContent = highScore;
  scoreEl.textContent = '0';
  spawnFood();
  draw();
}

function spawnFood() {
  const free = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!snake.some(s => s.x === x && s.y === y)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return;
  food = free[Math.floor(Math.random() * free.length)];
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= canvas.width; x += SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#ff4757';
  ctx.shadowColor = '#ff4757';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  const fx = food.x * SIZE + SIZE / 2;
  const fy = food.y * SIZE + SIZE / 2;
  ctx.arc(fx, fy, SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  snake.forEach((seg, i) => {
    const gradient = ctx.createRadialGradient(
      seg.x * SIZE + SIZE / 2, seg.y * SIZE + SIZE / 2, 2,
      seg.x * SIZE + SIZE / 2, seg.y * SIZE + SIZE / 2, SIZE / 2
    );
    gradient.addColorStop(0, '#00f0c0');
    gradient.addColorStop(1, '#00a67e');
    ctx.fillStyle = i === 0 ? '#00ffcc' : gradient;
    ctx.shadowColor = '#00d4aa';
    ctx.shadowBlur = i === 0 ? 12 : 4;
    ctx.fillRect(seg.x * SIZE + 1, seg.y * SIZE + 1, SIZE - 2, SIZE - 2);
  });
  ctx.shadowBlur = 0;

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4757';
    ctx.font = 'bold 32px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
  }

  if (paused && !gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-bright').trim();
    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2);
  }
}

function update() {
  if (gameOver || paused) return;

  direction = { ...nextDirection };

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (head.x < 0) head.x = COLS - 1;
  if (head.x >= COLS) head.x = 0;
  if (head.y < 0) head.y = ROWS - 1;
  if (head.y >= ROWS) head.y = 0;

  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = score;
      localStorage.setItem('snake_highscore', score);
      if (username) checkWorldRecord(score);
    }
    draw();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function loop() {
  update();
  loopId = setTimeout(loop, 120);
}

function changeDir(dx, dy) {
  if (direction.x + dx === 0 && direction.y + dy === 0) return;
  nextDirection = { x: dx, y: dy };
}

document.addEventListener('keydown', (e) => {
  if (usernameModal.classList.contains('active') || recordsModal.classList.contains('active') || newRecordModal.classList.contains('active')) return;
  const keyMap = {
    ArrowUp:    { x: 0,  y: -1 },
    ArrowDown:  { x: 0,  y: 1  },
    ArrowLeft:  { x: -1, y: 0  },
    ArrowRight: { x: 1,  y: 0  },
  };
  const dir = keyMap[e.key];
  if (dir) {
    e.preventDefault();
    changeDir(dir.x, dir.y);
  }
  if (e.key === ' ') {
    e.preventDefault();
    if (!gameOver) paused = !paused;
    draw();
  }
});

restartBtn.addEventListener('click', restart);
restartBtn.addEventListener('touchstart', (e) => { e.preventDefault(); restart(); });

function restart() {
  clearTimeout(loopId);
  init();
  loop();
}

init();
loop();
