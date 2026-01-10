// THE MIC IS HOT - KJ Control Panel

const socket = io();

// State
let currentSong = null;
let queue = [];
let isPaused = false;
let partyStarted = false;

// DOM Elements
const statusBadge = document.getElementById('status-badge');
const nowPlayingCard = document.getElementById('now-playing-card');
const npName = document.getElementById('np-name');
const npSong = document.getElementById('np-song');
const queueList = document.getElementById('queue-list');
const queueCount = document.getElementById('queue-count');
const statQueued = document.getElementById('stat-queued');
const statCompleted = document.getElementById('stat-completed');
const statDrunk = document.getElementById('stat-drunk');

const btnStart = document.getElementById('btn-start');
const btnAdvance = document.getElementById('btn-advance');
const btnSkip = document.getElementById('btn-skip');
const btnPause = document.getElementById('btn-pause');
const btnEmergency = document.getElementById('btn-emergency');

// API calls
async function apiCall(endpoint, method = 'POST') {
  try {
    const response = await fetch(endpoint, { method });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    alert('Something went wrong. Check the console.');
    return null;
  }
}

// Update status badge
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

// Update now playing card
function updateNowPlaying() {
  if (currentSong) {
    nowPlayingCard.classList.remove('hidden');
    nowPlayingCard.classList.toggle('vip', currentSong.is_vip);
    npName.textContent = currentSong.guestName + (currentSong.is_vip ? ' 👑' : '');
    npSong.textContent = currentSong.songTitle;

    btnAdvance.disabled = false;
    btnSkip.disabled = false;
    btnPause.disabled = false;
    btnStart.disabled = true;
  } else {
    nowPlayingCard.classList.add('hidden');
    btnAdvance.disabled = true;
    btnSkip.disabled = true;
    btnPause.disabled = queue.length === 0;
    btnStart.disabled = queue.length === 0;
  }
}

// Render queue using safe DOM methods
function renderQueue() {
  queueList.textContent = '';
  queueCount.textContent = `${queue.length} songs`;

  if (queue.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-queue';

    const p1 = document.createElement('p');
    p1.textContent = 'No songs in queue';

    const p2 = document.createElement('p');
    p2.style.fontSize = '0.875rem';
    p2.textContent = 'Waiting for guests to sign up...';

    empty.appendChild(p1);
    empty.appendChild(p2);
    queueList.appendChild(empty);
    return;
  }

  queue.forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'kj-queue-item';
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
      badge.className = 'vip-badge';
      badge.textContent = '👑 VIP';
      name.appendChild(badge);
    }

    const songTitle = document.createElement('div');
    songTitle.className = 'queue-song';
    songTitle.textContent = song.songTitle;

    info.appendChild(name);
    info.appendChild(songTitle);

    const actions = document.createElement('div');
    actions.className = 'queue-actions';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'queue-action-btn';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Remove from queue';
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

    // Drag events for reordering
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);

    queueList.appendChild(item);
  });
}

// Drag and drop handling
let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
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
  this.classList.remove('dragging');
  draggedItem = null;
}

// API Actions
async function startParty() {
  const result = await apiCall('/api/kj/start');
  if (result?.success) {
    partyStarted = true;
  }
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
    btnPause.querySelector('.control-icon').textContent = isPaused ? '▶️' : '⏸️';
    btnPause.querySelector('span:last-child')?.remove();
    const label = document.createElement('span');
    label.textContent = isPaused ? 'Resume Queue' : 'Pause Queue';
    btnPause.appendChild(label);
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

function emergencyStop() {
  if (confirm('EMERGENCY STOP: This will pause everything. Continue?')) {
    togglePause();
    // Could add more emergency actions here
    alert('Queue paused. Refresh display screens to reset.');
  }
}

// Button event listeners
btnStart.addEventListener('click', startParty);
btnAdvance.addEventListener('click', advanceToNext);
btnSkip.addEventListener('click', skipCurrent);
btnPause.addEventListener('click', togglePause);
btnEmergency.addEventListener('click', emergencyStop);

// Socket events
socket.on('queue-updated', (data) => {
  queue = data.queue || [];
  currentSong = data.current || null;

  renderQueue();
  updateNowPlaying();
  updateStatus();

  // Update stats
  if (data.stats) {
    statQueued.textContent = data.stats.totalQueued;
    statCompleted.textContent = data.stats.totalCompleted;
    statDrunk.textContent = `${data.stats.drunkOMeter}%`;
  }
});

socket.on('now-playing', (data) => {
  currentSong = data.song;
  updateNowPlaying();
  updateStatus();
});

socket.on('pause-state', (data) => {
  isPaused = data.isPaused;
  btnPause.querySelector('.control-icon').textContent = isPaused ? '▶️' : '⏸️';
  updateStatus();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Space = advance (when current song playing)
  if (e.code === 'Space' && currentSong && !e.target.matches('input, textarea')) {
    e.preventDefault();
    advanceToNext();
  }
  // S = skip
  if (e.code === 'KeyS' && currentSong && !e.target.matches('input, textarea')) {
    e.preventDefault();
    skipCurrent();
  }
  // P = pause
  if (e.code === 'KeyP' && !e.target.matches('input, textarea')) {
    e.preventDefault();
    togglePause();
  }
});

// Initial state
updateStatus();
