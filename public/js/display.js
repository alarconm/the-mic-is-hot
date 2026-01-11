// THE MIC IS HOT - Party Display Screen

const socket = io();

// State
let currentSong = null;
let queue = [];
let countdownInterval = null;
let countdownSeconds = 90;
let isPaused = false;
let performanceTimerInterval = null;
let performanceStartTime = null;

// Drunk-o-meter status messages
const drunkStatuses = [
  { max: 20, text: "Sober Karaoke (Boring)", color: "#00FF88" },
  { max: 40, text: "Liquid Courage Activated", color: "#88FF00" },
  { max: 60, text: "Peak Performance Zone", color: "#FFD700" },
  { max: 80, text: "No F*cks Given", color: "#FF8800" },
  { max: 100, text: "LEGENDARY STATUS", color: "#FF1493" },
];

// Countdown messages
const countdownMessages = {
  90: "Your moment approaches...",
  60: "Get ready, superstar!",
  30: "WHERE ARE YOU?!",
  10: "LAST CALL! Move your ass!",
  5: "5... 4... 3... 2... 1...",
};

// DOM Elements
const waitingScreen = document.getElementById('waiting-screen');
const nowPlayingScreen = document.getElementById('now-playing-screen');
const countdownScreen = document.getElementById('countdown-screen');
const currentName = document.getElementById('current-name');
const currentSongEl = document.getElementById('current-song');
const roastText = document.getElementById('roast-text');
const countdownName = document.getElementById('countdown-name');
const countdownSongEl = document.getElementById('countdown-song');
const countdownRoast = document.getElementById('countdown-roast');
const countdownTimer = document.getElementById('countdown-timer');
const countdownMessage = document.getElementById('countdown-message');
const queuePreview = document.getElementById('queue-preview');
const drunkMeterFill = document.getElementById('drunk-meter-fill');
const drunkMeterStatus = document.getElementById('drunk-meter-status');
const hallOfFame = document.getElementById('hall-of-fame');
const songsCount = document.getElementById('songs-count');
const reactionOverlay = document.getElementById('reaction-overlay');
const confettiContainer = document.getElementById('confetti-container');
const pausedOverlay = document.getElementById('paused-overlay');
const youtubeLink = document.getElementById('youtube-link');
const timerDisplay = document.getElementById('timer-display');

// Set YouTube link for current song
function setYouTubeLink(song) {
  if (song.youtubeUrl) {
    youtubeLink.href = song.youtubeUrl;
  } else if (song.youtubeId) {
    youtubeLink.href = `https://www.youtube.com/watch?v=${song.youtubeId}`;
  }
}

// Start performance timer
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

// Update timer display
function updateTimerDisplay() {
  if (!performanceStartTime) return;

  const elapsed = Math.floor((Date.now() - performanceStartTime.getTime()) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Stop performance timer
function stopPerformanceTimer() {
  clearInterval(performanceTimerInterval);
  performanceStartTime = null;
  timerDisplay.textContent = '0:00';
}

// Show appropriate screen
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

// Start countdown for next performer
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
      // Time's up - show now playing (timer starts now)
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

// Show now playing screen
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

// Render queue sidebar using safe DOM methods
function renderQueue(queueData) {
  queue = queueData;
  queuePreview.textContent = '';

  if (!queueData || queueData.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.padding = '2rem';

    const icon = document.createElement('div');
    icon.style.fontSize = '2rem';
    icon.style.marginBottom = '0.5rem';
    icon.textContent = '🎤';

    const text = document.createElement('p');
    text.textContent = 'No one in queue yet!';

    empty.appendChild(icon);
    empty.appendChild(text);
    queuePreview.appendChild(empty);
    return;
  }

  queueData.slice(0, 8).forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'up-next-item';
    if (index === 0) item.classList.add('next');
    if (song.is_vip) item.classList.add('vip');

    const position = document.createElement('div');
    position.className = 'up-next-position';
    position.textContent = index + 1;

    const info = document.createElement('div');
    info.className = 'up-next-info';

    const name = document.createElement('div');
    name.className = 'up-next-name';
    name.textContent = song.guestName;

    if (song.is_vip) {
      const badge = document.createElement('span');
      badge.className = 'vip-badge';
      badge.textContent = '👑';
      name.appendChild(badge);
    }

    const songTitle = document.createElement('div');
    songTitle.className = 'up-next-song';
    songTitle.textContent = song.songTitle;

    info.appendChild(name);
    info.appendChild(songTitle);

    item.appendChild(position);
    item.appendChild(info);
    queuePreview.appendChild(item);
  });

  if (queueData.length > 8) {
    const more = document.createElement('div');
    more.style.cssText = 'text-align: center; padding: 1rem; color: var(--text-muted);';
    more.textContent = `+${queueData.length - 8} more`;
    queuePreview.appendChild(more);
  }
}

// Update drunk-o-meter
function updateDrunkOMeter(level) {
  drunkMeterFill.style.width = `${level}%`;

  const status = drunkStatuses.find(s => level <= s.max) || drunkStatuses[drunkStatuses.length - 1];
  drunkMeterStatus.textContent = status.text;
  drunkMeterStatus.style.color = status.color;
}

// Update hall of fame using safe DOM methods
function updateHallOfFame(data) {
  hallOfFame.textContent = '';

  if (data.micHog) {
    const item = document.createElement('div');
    item.className = 'hall-item';

    const icon = document.createElement('div');
    icon.className = 'hall-icon';
    icon.textContent = '🎙️';

    const info = document.createElement('div');
    info.className = 'hall-info';

    const title = document.createElement('div');
    title.className = 'hall-title';
    title.textContent = 'The Mic Hog';

    const name = document.createElement('div');
    name.className = 'hall-name';
    name.textContent = `${data.micHog.guest_name} (${data.micHog.song_count} songs)`;

    info.appendChild(title);
    info.appendChild(name);
    item.appendChild(icon);
    item.appendChild(info);
    hallOfFame.appendChild(item);
  }

  if (data.oneHitWonderCount > 0) {
    const item = document.createElement('div');
    item.className = 'hall-item';

    const icon = document.createElement('div');
    icon.className = 'hall-icon';
    icon.textContent = '⭐';

    const info = document.createElement('div');
    info.className = 'hall-info';

    const title = document.createElement('div');
    title.className = 'hall-title';
    title.textContent = 'One Hit Wonders';

    const name = document.createElement('div');
    name.className = 'hall-name';
    name.textContent = `${data.oneHitWonderCount} people`;

    info.appendChild(title);
    info.appendChild(name);
    item.appendChild(icon);
    item.appendChild(info);
    hallOfFame.appendChild(item);
  }
}

// Floating reaction
function showReaction(emoji) {
  const reaction = document.createElement('div');
  reaction.className = 'floating-reaction';
  reaction.textContent = emoji;

  // Random position at bottom of screen
  const x = Math.random() * (window.innerWidth - 400);
  reaction.style.left = `${x}px`;
  reaction.style.bottom = '0';

  reactionOverlay.appendChild(reaction);

  // Remove after animation
  setTimeout(() => reaction.remove(), 3000);
}

// Confetti celebration
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

// Socket events
socket.on('queue-updated', (data) => {
  renderQueue(data.queue);

  if (data.stats) {
    updateDrunkOMeter(data.stats.drunkOMeter);
    songsCount.textContent = data.stats.totalCompleted;
  }

  if (data.hallOfFame) {
    updateHallOfFame(data.hallOfFame);
  }

  // If no current song and queue is empty, show waiting
  if (!data.current && (!data.queue || data.queue.length === 0)) {
    stopPerformanceTimer();
    showScreen('waiting');
  } else if (!data.current && data.queue && data.queue.length > 0) {
    // No current song but queue has songs - stop timer and show waiting
    stopPerformanceTimer();
  }
});

socket.on('now-playing', (data) => {
  // Start countdown for next performer
  startCountdown(data.song, data.roast, data.isVip);

  // Auto-open YouTube video if autoPlay flag is set
  if (data.autoPlay && data.song) {
    const youtubeUrl = data.song.youtubeUrl || `https://www.youtube.com/watch?v=${data.song.youtubeId}`;
    window.open(youtubeUrl, '_blank');
  }
});

socket.on('reaction', (data) => {
  showReaction(data.emoji);
});

socket.on('pause-state', (data) => {
  isPaused = data.isPaused;
  pausedOverlay.classList.toggle('active', isPaused);
});

socket.on('vip-skip', (data) => {
  // Show special VIP skip notification
  triggerConfetti();
  showReaction('👑');
  showReaction('⚡');
  showReaction('👑');
});

// Initialize - show waiting screen
showScreen('waiting');

// Fullscreen on double click
document.addEventListener('dblclick', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
});

// Show cursor on mouse move, hide after 3 seconds
let cursorTimeout;
document.addEventListener('mousemove', () => {
  document.body.style.cursor = 'default';
  clearTimeout(cursorTimeout);
  cursorTimeout = setTimeout(() => {
    document.body.style.cursor = 'none';
  }, 3000);
});
