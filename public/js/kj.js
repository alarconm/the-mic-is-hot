// THE MIC IS HOT - Combined KJ Control + Display
// This is the main view for projectors with KJ controls in sidebar

const socket = io();

// ============ STATE ============
let currentSong = null;
let queue = [];
let isPaused = false;
let countdownInterval = null;
let countdownSeconds = 90;
let performanceTimerInterval = null;
let performanceStartTime = null;

// Drunk-o-meter status messages
const drunkStatuses = [
  { max: 20, text: "Sober Karaoke", color: "#00FF88" },
  { max: 40, text: "Liquid Courage", color: "#88FF00" },
  { max: 60, text: "Peak Performance", color: "#FFD700" },
  { max: 80, text: "No F*cks Given", color: "#FF8800" },
  { max: 100, text: "LEGENDARY", color: "#FF1493" },
];

// Countdown messages
const countdownMessages = {
  90: "Your moment approaches...",
  60: "Get ready, superstar!",
  30: "WHERE ARE YOU?!",
  10: "LAST CALL! Move it!",
  5: "5... 4... 3... 2... 1...",
};

// ============ DOM ELEMENTS ============

// Screens
const waitingScreen = document.getElementById('waiting-screen');
const nowPlayingScreen = document.getElementById('now-playing-screen');
const countdownScreen = document.getElementById('countdown-screen');

// Display elements
const statusBadge = document.getElementById('status-badge');
const currentName = document.getElementById('current-name');
const currentSongEl = document.getElementById('current-song');
const roastText = document.getElementById('roast-text');
const countdownName = document.getElementById('countdown-name');
const countdownSongEl = document.getElementById('countdown-song');
const countdownRoast = document.getElementById('countdown-roast');
const countdownTimer = document.getElementById('countdown-timer');
const countdownMessage = document.getElementById('countdown-message');
const youtubeLink = document.getElementById('youtube-link');
const timerDisplay = document.getElementById('timer-display');
const pausedOverlay = document.getElementById('paused-overlay');
const reactionOverlay = document.getElementById('reaction-overlay');
const confettiContainer = document.getElementById('confetti-container');

// Sidebar elements
const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');
const statQueued = document.getElementById('stat-queued');
const statCompleted = document.getElementById('stat-completed');
const drunkMeterFill = document.getElementById('drunk-meter-fill');
const drunkMeterStatus = document.getElementById('drunk-meter-status');

// Buttons
const btnStart = document.getElementById('btn-start');
const btnAdvance = document.getElementById('btn-advance');
const btnSkip = document.getElementById('btn-skip');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const btnFullscreen = document.getElementById('btn-fullscreen');

// ============ SCREEN MANAGEMENT ============

function showScreen(screen) {
  waitingScreen.classList.add('hidden');
  nowPlayingScreen.classList.add('hidden');
  countdownScreen.classList.add('hidden');

  if (screen === 'waiting') {
    waitingScreen.classList.remove('hidden');
  } else if (screen === 'playing') {
    nowPlayingScreen.classList.remove('hidden');
  } else if (screen === 'countdown') {
    countdownScreen.classList.remove('hidden');
  }
}

// ============ TIMER FUNCTIONS ============

function startPerformanceTimer(startedAt) {
  clearInterval(performanceTimerInterval);

  if (startedAt) {
    performanceStartTime = new Date(startedAt);
  } else {
    performanceStartTime = new Date();
  }

  updateTimerDisplay();
  performanceTimerInterval = setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
  if (!performanceStartTime) return;

  const elapsed = Math.floor((Date.now() - performanceStartTime.getTime()) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function stopPerformanceTimer() {
  clearInterval(performanceTimerInterval);
  performanceStartTime = null;
  timerDisplay.textContent = '0:00';
}

// ============ COUNTDOWN ============

function startCountdown(song, roast, isVip) {
  clearInterval(countdownInterval);
  countdownSeconds = 90;

  // Update display
  countdownName.textContent = song.guestName;
  countdownName.classList.toggle('vip', isVip);
  countdownSongEl.textContent = song.songTitle;
  countdownRoast.textContent = roast;

  showScreen('countdown');

  // If VIP, trigger confetti
  if (isVip) {
    triggerConfetti();
  }

  // Update countdown
  updateCountdownDisplay();

  countdownInterval = setInterval(() => {
    if (isPaused) return;

    countdownSeconds--;
    updateCountdownDisplay();

    if (countdownSeconds <= 0) {
      clearInterval(countdownInterval);
      // Time's up - show now playing
      showNowPlaying(song, roast, isVip, new Date().toISOString());
    }
  }, 1000);
}

function updateCountdownDisplay() {
  countdownTimer.textContent = countdownSeconds;

  // Update styling based on urgency
  countdownTimer.classList.remove('warning', 'urgent', 'critical');
  if (countdownSeconds <= 10) {
    countdownTimer.classList.add('critical');
  } else if (countdownSeconds <= 30) {
    countdownTimer.classList.add('urgent');
  } else if (countdownSeconds <= 60) {
    countdownTimer.classList.add('warning');
  }

  // Update message
  for (const [threshold, message] of Object.entries(countdownMessages).sort((a, b) => b[0] - a[0])) {
    if (countdownSeconds <= parseInt(threshold)) {
      countdownMessage.textContent = message;
    }
  }
}

// ============ NOW PLAYING ============

function showNowPlaying(song, roast, isVip, startedAt) {
  currentSong = song;

  currentName.textContent = song.guestName;
  currentName.classList.toggle('vip', isVip);
  currentSongEl.textContent = song.songTitle;
  roastText.textContent = roast;

  // Set YouTube link
  setYouTubeLink(song);

  // Start the performance timer
  startPerformanceTimer(startedAt);

  showScreen('playing');

  // If VIP, extra celebration
  if (isVip) {
    triggerConfetti();
  }
}

function setYouTubeLink(song) {
  if (song.youtubeUrl) {
    youtubeLink.href = song.youtubeUrl;
  } else if (song.youtubeId) {
    youtubeLink.href = `https://www.youtube.com/watch?v=${song.youtubeId}`;
  }
}

// ============ STATUS & UI UPDATES ============

function updateStatus() {
  statusBadge.classList.remove('status-live', 'status-paused', 'status-waiting');

  if (isPaused) {
    statusBadge.textContent = '⏸️ Paused';
    statusBadge.classList.add('status-paused');
  } else if (currentSong) {
    statusBadge.textContent = '🔴 LIVE';
    statusBadge.classList.add('status-live');
  } else if (queue.length > 0) {
    statusBadge.textContent = 'Ready';
    statusBadge.classList.add('status-waiting');
  } else {
    statusBadge.textContent = 'Waiting';
    statusBadge.classList.add('status-waiting');
  }
}

function updateButtonStates() {
  if (currentSong) {
    btnAdvance.disabled = false;
    btnSkip.disabled = false;
    btnPause.disabled = false;
    btnStart.disabled = true;
  } else {
    btnAdvance.disabled = true;
    btnSkip.disabled = true;
    btnPause.disabled = queue.length === 0;
    btnStart.disabled = queue.length === 0;
  }
}

function updateDrunkOMeter(level) {
  drunkMeterFill.style.width = `${level}%`;

  const status = drunkStatuses.find(s => level <= s.max) || drunkStatuses[drunkStatuses.length - 1];
  drunkMeterStatus.textContent = status.text;
  drunkMeterStatus.style.color = status.color;
}

// ============ QUEUE RENDERING ============

function renderQueue() {
  queueList.textContent = '';
  queueCount.textContent = queue.length;

  if (queue.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-queue';
    empty.textContent = 'No songs in queue';
    queueList.appendChild(empty);
    return;
  }

  queue.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'kj-queue-item';
    if (index === 0) item.classList.add('next');
    if (song.is_vip) item.classList.add('vip');
    item.draggable = true;
    item.dataset.songId = song.id;

    const position = document.createElement('div');
    position.className = 'queue-position';
    position.textContent = index + 1;

    const info = document.createElement('div');
    info.className = 'queue-info';

    const name = document.createElement('div');
    name.className = 'queue-name';
    name.textContent = song.guestName;
    if (song.is_vip) {
      const badge = document.createElement('span');
      badge.textContent = ' 👑';
      name.appendChild(badge);
    }

    const songTitle = document.createElement('div');
    songTitle.className = 'queue-song';
    songTitle.textContent = song.songTitle;

    info.appendChild(name);
    info.appendChild(songTitle);

    const actions = document.createElement('div');
    actions.className = 'queue-actions';

    // YouTube link button
    if (song.youtubeUrl || song.youtubeId) {
      const ytBtn = document.createElement('a');
      ytBtn.className = 'queue-action-btn';
      ytBtn.href = song.youtubeUrl || `https://www.youtube.com/watch?v=${song.youtubeId}`;
      ytBtn.target = '_blank';
      ytBtn.textContent = '▶';
      ytBtn.title = 'Open YouTube';
      ytBtn.style.background = 'rgba(255, 0, 0, 0.1)';
      ytBtn.style.color = '#DC2626';
      ytBtn.style.textDecoration = 'none';
      ytBtn.addEventListener('click', (e) => e.stopPropagation());
      actions.appendChild(ytBtn);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'queue-action-btn';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Remove "${song.songTitle}" by ${song.guestName}?`)) {
        removeSong(song.id);
      }
    });

    actions.appendChild(removeBtn);

    item.appendChild(position);
    item.appendChild(info);
    item.appendChild(actions);

    // Drag events
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);

    queueList.appendChild(item);
  });
}

// Drag and drop
let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  if (draggedItem !== this) {
    const fromId = draggedItem.dataset.songId;
    const toIndex = Array.from(queueList.children).indexOf(this);
    moveSong(fromId, toIndex);
  }
}

function handleDragEnd() {
  this.style.opacity = '1';
  draggedItem = null;
}

// ============ REACTIONS & CONFETTI ============

function showReaction(emoji) {
  const reaction = document.createElement('div');
  reaction.className = 'floating-reaction';
  reaction.textContent = emoji;

  const x = Math.random() * (window.innerWidth - 400);
  reaction.style.left = `${x}px`;
  reaction.style.bottom = '0';

  reactionOverlay.appendChild(reaction);
  setTimeout(() => reaction.remove(), 3000);
}

function triggerConfetti() {
  const colors = ['#FF4500', '#FF1493', '#FFD700', '#00FF88', '#8B5CF6'];

  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confettiContainer.appendChild(confetti);

      setTimeout(() => confetti.remove(), 4000);
    }, i * 30);
  }
}

// ============ API CALLS ============

async function apiCall(endpoint, method = 'POST') {
  try {
    const response = await fetch(endpoint, { method });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

async function startParty() {
  await apiCall('/api/kj/start');
}

async function advanceToNext() {
  await apiCall('/api/kj/advance');
}

async function skipCurrent() {
  if (confirm('Skip the current performer?')) {
    await apiCall('/api/kj/skip');
  }
}

async function togglePause() {
  const result = await apiCall('/api/kj/pause');
  if (result) {
    isPaused = result.isPaused;
    const iconSpan = btnPause.querySelector('.control-icon');
    if (iconSpan) {
      iconSpan.textContent = isPaused ? '▶️' : '⏸️';
    }
    updateStatus();
  }
}

async function removeSong(songId) {
  await apiCall(`/api/kj/remove/${songId}`);
}

async function moveSong(songId, position) {
  await fetch('/api/kj/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ songId: parseInt(songId), position })
  });
}

async function resetParty() {
  if (confirm('Reset the party? This clears all songs and stats.')) {
    const result = await apiCall('/api/kj/reset');
    if (result?.success) {
      stopPerformanceTimer();
      showScreen('waiting');
    }
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    document.body.classList.remove('fullscreen-mode');
  } else {
    document.documentElement.requestFullscreen();
    document.body.classList.add('fullscreen-mode');
  }
}

// ============ EVENT LISTENERS ============

btnStart.addEventListener('click', startParty);
btnAdvance.addEventListener('click', advanceToNext);
btnSkip.addEventListener('click', skipCurrent);
btnPause.addEventListener('click', togglePause);
btnReset.addEventListener('click', resetParty);
btnFullscreen.addEventListener('click', toggleFullscreen);

// Double-click main stage for fullscreen
document.querySelector('.main-stage').addEventListener('dblclick', toggleFullscreen);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;

  if (e.code === 'Space' && currentSong) {
    e.preventDefault();
    advanceToNext();
  }
  if (e.code === 'KeyS' && currentSong) {
    e.preventDefault();
    skipCurrent();
  }
  if (e.code === 'KeyP') {
    e.preventDefault();
    togglePause();
  }
  if (e.code === 'KeyF') {
    e.preventDefault();
    toggleFullscreen();
  }
});

// ============ SOCKET EVENTS ============

socket.on('queue-updated', (data) => {
  queue = data.queue || [];
  currentSong = data.current || null;

  renderQueue();
  updateButtonStates();
  updateStatus();

  // Update stats
  if (data.stats) {
    statQueued.textContent = data.stats.totalQueued;
    statCompleted.textContent = data.stats.totalCompleted;
    updateDrunkOMeter(data.stats.drunkOMeter);
  }

  // Handle screen state
  if (!currentSong && queue.length === 0) {
    stopPerformanceTimer();
    clearInterval(countdownInterval);
    showScreen('waiting');
  } else if (!currentSong && queue.length > 0) {
    // Queue has songs but nothing playing - show waiting
    stopPerformanceTimer();
  }
});

socket.on('now-playing', (data) => {
  // Start countdown for next performer
  startCountdown(data.song, data.roast, data.isVip);

  // Auto-open YouTube video if autoPlay flag is set (performer clicked Start on their phone)
  if (data.autoPlay && data.song) {
    const youtubeUrl = data.song.youtubeUrl || `https://www.youtube.com/watch?v=${data.song.youtubeId}`;
    if (youtubeUrl) {
      console.log('Performer started - auto-opening YouTube:', youtubeUrl);

      // Try to open YouTube automatically
      const newWindow = window.open(youtubeUrl, '_blank');

      // If popup was blocked, show a notification
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log('Popup blocked - showing manual prompt');
        showAutoPlayNotification(youtubeUrl);
      }
    }
  }

  currentSong = data.song;
  updateButtonStates();
  updateStatus();
});

// Show notification when auto-play is blocked (using safe DOM methods)
function showAutoPlayNotification(url) {
  // Remove existing notification if any
  const existing = document.getElementById('autoplay-notification');
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'autoplay-notification';
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #FF6B6B, #F72585);
    padding: 2rem 3rem;
    border-radius: 24px;
    z-index: 1000;
    text-align: center;
    box-shadow: 0 16px 48px rgba(247, 37, 133, 0.5);
    animation: pulse 1s infinite;
  `;

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size: 3rem; margin-bottom: 1rem;';
  icon.textContent = '🎤';

  const title = document.createElement('div');
  title.style.cssText = 'font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 1rem;';
  title.textContent = 'PERFORMER IS READY!';

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.style.cssText = `
    display: inline-block;
    background: white;
    color: #F72585;
    padding: 1rem 2rem;
    border-radius: 16px;
    font-size: 1.25rem;
    font-weight: 800;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  `;
  link.textContent = '▶ CLICK TO PLAY VIDEO';
  link.addEventListener('click', () => overlay.remove());

  overlay.appendChild(icon);
  overlay.appendChild(title);
  overlay.appendChild(link);
  document.body.appendChild(overlay);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.getElementById('autoplay-notification')) {
      document.getElementById('autoplay-notification').remove();
    }
  }, 10000);
}

socket.on('reaction', (data) => {
  showReaction(data.emoji);
});

socket.on('pause-state', (data) => {
  isPaused = data.isPaused;
  pausedOverlay.classList.toggle('active', isPaused);

  const iconSpan = btnPause.querySelector('.control-icon');
  if (iconSpan) {
    iconSpan.textContent = isPaused ? '▶️' : '⏸️';
  }
  updateStatus();
});

socket.on('vip-skip', (data) => {
  triggerConfetti();
  showReaction('👑');
  showReaction('⚡');
  showReaction('👑');
});

socket.on('party-reset', () => {
  stopPerformanceTimer();
  clearInterval(countdownInterval);
  showScreen('waiting');
});

// ============ INITIALIZE ============

showScreen('waiting');
updateStatus();
