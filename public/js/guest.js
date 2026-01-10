// THE MIC IS HOT - Guest Mobile Experience

const socket = io();

// State
let deviceId = localStorage.getItem('micIsHot_deviceId');
let guest = null;
let currentQueue = [];
let mySongs = [];
let currentlyPlaying = null;
let isMyTurn = false;
let amIPerforming = false;

// Loading messages for fun
const loadingMessages = [
  "Warming up the vocal cords...",
  "Judging your song choice...",
  "Alerting the neighbors...",
  "Preparing for auditory assault...",
  "Lowering expectations...",
  "Charging the drunk-o-meter...",
  "Waking up the karaoke gods...",
];

// HTML escape function to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Generate device ID if not exists
if (!deviceId) {
  deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  localStorage.setItem('micIsHot_deviceId', deviceId);
}

// DOM Elements
const registrationView = document.getElementById('registration-view');
const mainView = document.getElementById('main-view');
const registerForm = document.getElementById('register-form');
const guestNameInput = document.getElementById('guest-name');
const displayName = document.getElementById('display-name');
const songForm = document.getElementById('song-form');
const songTitleInput = document.getElementById('song-title');
const youtubeUrlInput = document.getElementById('youtube-url');
const searchYoutubeBtn = document.getElementById('search-youtube-btn');
const youtubeModal = document.getElementById('youtube-modal');
const closeModalBtn = document.getElementById('close-modal');
const youtubeSearchInput = document.getElementById('youtube-search-input');
const youtubeResults = document.getElementById('youtube-results');
const queueList = document.getElementById('queue-list');
const mySongsList = document.getElementById('my-songs-list');
const videoPreview = document.getElementById('video-preview');
const previewThumb = document.getElementById('preview-thumb');
const previewTitle = document.getElementById('preview-title');
const vipBanner = document.getElementById('vip-banner');
const vipSkipSection = document.getElementById('vip-skip-section');
const vipSkipBtn = document.getElementById('vip-skip-btn');
const myPosition = document.getElementById('my-position');
const positionNum = document.getElementById('position-num');

// Tab handling
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
  });
});

// Check if already registered
async function checkRegistration() {
  try {
    const response = await fetch(`/api/guest/${deviceId}`);
    const data = await response.json();

    if (data.guest) {
      guest = data.guest;
      mySongs = data.songs || [];
      showMainView();
    }
  } catch (error) {
    console.error('Error checking registration:', error);
  }
}

// Show main view after registration
function showMainView() {
  registrationView.classList.add('hidden');
  mainView.classList.remove('hidden');
  displayName.textContent = guest.name;

  // VIP handling
  if (guest.is_vip) {
    vipBanner.classList.remove('hidden');
    vipSkipSection.classList.remove('hidden');

    if (guest.skip_used) {
      vipSkipBtn.textContent = 'Skip Power Used ✓';
      vipSkipBtn.disabled = true;
    }
  }

  renderMySongs();
}

// Registration form
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = guestNameInput.value.trim();

  if (!name) return;

  try {
    const response = await fetch('/api/guest/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, name })
    });

    const data = await response.json();

    if (data.guest) {
      guest = data.guest;
      showMainView();
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Oops! Something went wrong. Try again?');
  }
});

// Song submission form
songForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const songTitle = songTitleInput.value.trim();
  const youtubeUrl = youtubeUrlInput.value.trim();

  if (!songTitle || !youtubeUrl) return;

  // Validate YouTube URL
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) {
    alert('Please enter a valid YouTube URL!');
    return;
  }

  try {
    const response = await fetch('/api/songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, songTitle, youtubeUrl })
    });

    const data = await response.json();

    if (data.success) {
      // Clear form
      songTitleInput.value = '';
      youtubeUrlInput.value = '';
      videoPreview.classList.add('hidden');

      // Show success feedback
      showToast('Song added to the queue! 🎤');

      // Switch to queue tab
      document.querySelector('[data-tab="queue"]').click();
    } else {
      alert(data.error || 'Failed to add song');
    }
  } catch (error) {
    console.error('Submit song error:', error);
    alert('Oops! Something went wrong.');
  }
});

// YouTube search modal
searchYoutubeBtn.addEventListener('click', () => {
  youtubeModal.classList.add('active');
  youtubeSearchInput.value = songTitleInput.value + ' karaoke';
  youtubeSearchInput.focus();

  if (youtubeSearchInput.value.trim()) {
    searchYouTube(youtubeSearchInput.value);
  }
});

closeModalBtn.addEventListener('click', () => {
  youtubeModal.classList.remove('active');
});

// YouTube search
let searchTimeout;
youtubeSearchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (e.target.value.trim()) {
      searchYouTube(e.target.value);
    }
  }, 500);
});

function searchYouTube(query) {
  // Clear and rebuild with safe DOM methods
  youtubeResults.textContent = '';

  // Step 1 card
  const step1 = document.createElement('div');
  step1.className = 'card';
  step1.style.marginBottom = '1rem';
  step1.style.background = 'linear-gradient(135deg, rgba(255, 0, 0, 0.05), rgba(255, 0, 0, 0.1))';
  step1.style.border = '2px solid rgba(255, 0, 0, 0.2)';

  const step1Header = document.createElement('div');
  step1Header.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;';
  step1Header.innerHTML = '<span style="background: #FF0000; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: bold; font-size: 0.75rem;">STEP 1</span> <span style="font-weight: 600;">Open YouTube</span>';

  const link = document.createElement('a');
  link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  link.target = '_blank';
  link.className = 'btn btn-block';
  link.style.cssText = 'background: #FF0000; color: white; font-weight: 700;';
  link.textContent = `🔍 Search "${query.substring(0, 20)}${query.length > 20 ? '...' : ''}" on YouTube`;
  link.addEventListener('click', () => {
    // After clicking, show step 2 more prominently
    setTimeout(() => {
      step2.style.animation = 'pulse 0.5s ease';
    }, 500);
  });

  step1.appendChild(step1Header);
  step1.appendChild(link);

  // Step 2 card
  const step2 = document.createElement('div');
  step2.className = 'card';
  step2.style.marginBottom = '1rem';

  const step2Header = document.createElement('div');
  step2Header.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;';
  step2Header.innerHTML = '<span style="background: #06D6A0; color: white; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: bold; font-size: 0.75rem;">STEP 2</span> <span style="font-weight: 600;">Copy & Paste the URL</span>';

  const instructions = document.createElement('p');
  instructions.style.cssText = 'font-size: 0.85rem; color: #5C5F7B; margin-bottom: 1rem;';
  instructions.textContent = 'Find your karaoke video, tap Share → Copy link, then paste below:';

  const pasteInput = document.createElement('input');
  pasteInput.type = 'text';
  pasteInput.className = 'form-input';
  pasteInput.placeholder = 'Paste YouTube URL here...';
  pasteInput.style.marginBottom = '0.75rem';
  pasteInput.addEventListener('input', (e) => {
    const videoId = extractYouTubeId(e.target.value);
    if (videoId) {
      youtubeUrlInput.value = e.target.value;
      previewThumb.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      previewTitle.textContent = 'Video found! ✓';
      videoPreview.classList.remove('hidden');
      youtubeModal.classList.remove('active');
      showToast('Video added! Now submit your song 🎤');
    }
  });

  const pasteBtn = document.createElement('button');
  pasteBtn.type = 'button';
  pasteBtn.className = 'btn btn-hot btn-block';
  pasteBtn.textContent = '📋 Paste from Clipboard';
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const videoId = extractYouTubeId(text);
      if (videoId) {
        youtubeUrlInput.value = text;
        previewThumb.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        previewTitle.textContent = 'Video found! ✓';
        videoPreview.classList.remove('hidden');
        youtubeModal.classList.remove('active');
        showToast('Video added! Now submit your song 🎤');
      } else {
        showToast('No YouTube URL found in clipboard');
      }
    } catch (err) {
      // Clipboard API not available, show manual input
      pasteInput.focus();
      showToast('Paste the URL in the text box above');
    }
  });

  step2.appendChild(step2Header);
  step2.appendChild(instructions);
  step2.appendChild(pasteInput);
  step2.appendChild(pasteBtn);

  youtubeResults.appendChild(step1);
  youtubeResults.appendChild(step2);
}

// Video preview when URL is pasted
youtubeUrlInput.addEventListener('input', (e) => {
  const url = e.target.value;
  const videoId = extractYouTubeId(url);

  if (videoId) {
    previewThumb.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    previewTitle.textContent = 'Video found! ✓';
    videoPreview.classList.remove('hidden');
  } else {
    videoPreview.classList.add('hidden');
  }
});

// Extract YouTube video ID
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Render queue using safe DOM methods
function renderQueue(queue) {
  queueList.textContent = '';

  if (!queue || queue.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">🎤</div>
      <div class="empty-state-title">No songs in queue!</div>
      <p>Be the first to sign up!</p>
    `;
    queueList.appendChild(emptyState);
    myPosition.classList.add('hidden');
    return;
  }

  // Find my position
  let myNextPosition = -1;
  for (let i = 0; i < queue.length; i++) {
    if (queue[i].guest_id === deviceId) {
      myNextPosition = i + 1;
      break;
    }
  }

  if (myNextPosition > 0) {
    positionNum.textContent = myNextPosition;
    myPosition.classList.remove('hidden');
  } else {
    myPosition.classList.add('hidden');
  }

  queue.slice(0, 10).forEach((song, index) => {
    const item = document.createElement('div');
    item.className = 'queue-item animate-in';
    if (song.guestId === deviceId) item.classList.add('current');
    if (song.is_vip) item.classList.add('vip');

    const position = document.createElement('div');
    position.className = 'queue-position';
    position.textContent = index + 1;

    const info = document.createElement('div');
    info.className = 'queue-info';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'queue-name';
    nameDiv.textContent = song.guestName;

    if (song.is_vip) {
      const badge = document.createElement('span');
      badge.className = 'vip-badge';
      badge.textContent = '👑 VIP';
      nameDiv.appendChild(badge);
    }

    const songDiv = document.createElement('div');
    songDiv.className = 'queue-song';
    songDiv.textContent = song.songTitle;

    info.appendChild(nameDiv);
    info.appendChild(songDiv);

    item.appendChild(position);
    item.appendChild(info);
    queueList.appendChild(item);
  });

  if (queue.length > 10) {
    const more = document.createElement('div');
    more.style.cssText = 'text-align: center; padding: 1rem; color: var(--text-muted);';
    more.textContent = `+${queue.length - 10} more in queue`;
    queueList.appendChild(more);
  }
}

// Render my songs using safe DOM methods
function renderMySongs() {
  mySongsList.textContent = '';

  if (!mySongs || mySongs.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <div class="empty-state-icon">🎤</div>
      <div class="empty-state-title">No songs yet!</div>
      <p>Add a song to see it here</p>
    `;
    mySongsList.appendChild(emptyState);
    return;
  }

  mySongs.forEach(song => {
    let statusClass = 'status-queued';
    let statusText = 'In Queue';

    if (song.status === 'current') {
      statusClass = 'status-current';
      statusText = "You're Up!";
    } else if (song.status === 'completed') {
      statusClass = 'status-completed';
      statusText = 'Done';
    } else if (song.status === 'skipped') {
      statusClass = 'status-completed';
      statusText = 'Skipped';
    }

    const item = document.createElement('div');
    item.className = 'my-song-item animate-in';

    const titleWrapper = document.createElement('div');
    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.textContent = song.songTitle;
    titleWrapper.appendChild(title);

    const status = document.createElement('span');
    status.className = `my-song-status ${statusClass}`;
    status.textContent = statusText;

    item.appendChild(titleWrapper);
    item.appendChild(status);
    mySongsList.appendChild(item);
  });
}

// Reaction buttons
document.querySelectorAll('.reaction-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const emoji = btn.dataset.emoji;

    try {
      await fetch('/api/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, guestName: guest?.name })
      });

      // Visual feedback
      btn.style.transform = 'scale(1.5)';
      setTimeout(() => btn.style.transform = '', 200);
    } catch (error) {
      console.error('Reaction error:', error);
    }
  });
});

// VIP Skip button
vipSkipBtn.addEventListener('click', async () => {
  // Find user's first queued song
  const myQueuedSong = currentQueue.find(s => s.guest_id === deviceId);

  if (!myQueuedSong) {
    alert('You need a song in the queue first!');
    return;
  }

  if (!confirm('Use your ONE-TIME skip power to jump to the front?')) {
    return;
  }

  try {
    const response = await fetch('/api/vip/skip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, songId: myQueuedSong.id })
    });

    const data = await response.json();

    if (data.success) {
      vipSkipBtn.textContent = 'Skip Power Used ✓';
      vipSkipBtn.disabled = true;
      showToast('👑 VIP SKIP ACTIVATED! You\'re next!');
    } else {
      alert(data.error || 'Skip failed');
    }
  } catch (error) {
    console.error('VIP skip error:', error);
  }
});

// Socket events
socket.on('queue-updated', (data) => {
  currentQueue = data.queue;
  currentlyPlaying = data.current;
  renderQueue(data.queue);
  updatePerformerStatus();

  // Update my songs from queue
  if (guest) {
    fetch(`/api/guest/${deviceId}`)
      .then(r => r.json())
      .then(d => {
        mySongs = d.songs || [];
        renderMySongs();

        // Enable VIP skip if has queued songs
        if (guest.is_vip && !guest.skip_used) {
          const hasQueuedSong = mySongs.some(s => s.status === 'queued');
          vipSkipBtn.disabled = !hasQueuedSong;
        }
      });
  }
});

socket.on('now-playing', (data) => {
  currentlyPlaying = data.song;
  if (data.song.guestId === deviceId) {
    amIPerforming = true;
    showToast("🎤 IT'S YOUR TURN! GET UP THERE!");
  }
  updatePerformerStatus();
});

socket.on('vip-skip', (data) => {
  showToast(`👑 ${data.guestName} used VIP SKIP!`);
});

socket.on('your-turn-soon', (data) => {
  if (data.guestId === deviceId) {
    showToast("🎤 You're up next! Get ready!");
    updatePerformerStatus();
  }
});

socket.on('party-reset', () => {
  currentlyPlaying = null;
  isMyTurn = false;
  amIPerforming = false;
  updatePerformerStatus();
  showToast("🎉 Party reset! Fresh start!");
});

// Timeout in minutes (must match server)
const SONG_TIMEOUT_MINUTES = 5;

// Update performer status and show/hide action buttons
function updatePerformerStatus() {
  // Check if I'm currently performing
  amIPerforming = currentlyPlaying && currentlyPlaying.guestId === deviceId;

  // Check if I'm first in queue
  const imFirstInQueue = currentQueue.length > 0 && currentQueue[0].guestId === deviceId;

  // Check if I'm next (first in queue and no one is performing OR timeout reached)
  isMyTurn = imFirstInQueue && !currentlyPlaying;

  renderPerformerActions(imFirstInQueue);
}

// Render performer action buttons
function renderPerformerActions(imFirstInQueue) {
  // Get or create the performer actions container
  let performerActions = document.getElementById('performer-actions');

  if (!performerActions) {
    // Create the container
    performerActions = document.createElement('div');
    performerActions.id = 'performer-actions';
    performerActions.className = 'card';
    performerActions.style.cssText = 'margin: 0.75rem; display: none;';

    // Insert before the tab-bar so it's always visible
    const mainView = document.getElementById('main-view');
    const tabBar = mainView?.querySelector('.tab-bar');
    if (mainView && tabBar) {
      mainView.insertBefore(performerActions, tabBar);
    }
  }

  // Clear and rebuild content
  performerActions.textContent = '';

  if (amIPerforming) {
    // Show "I'm Done" button
    performerActions.style.display = 'block';
    performerActions.style.background = 'linear-gradient(135deg, rgba(6, 214, 160, 0.15), rgba(6, 214, 160, 0.25))';
    performerActions.style.border = '2px solid #06D6A0';
    performerActions.style.animation = 'pulse 2s infinite';

    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 1rem;';
    header.innerHTML = '<div style="font-size: 2rem;">🎤</div><div style="font-size: 1.25rem; font-weight: 700; color: #06D6A0;">YOU\'RE PERFORMING!</div>';

    const currentSongInfo = document.createElement('div');
    currentSongInfo.style.cssText = 'text-align: center; margin-bottom: 1rem; font-size: 1rem; color: #5C5F7B;';
    currentSongInfo.textContent = currentlyPlaying ? currentlyPlaying.songTitle : '';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn btn-block';
    doneBtn.style.cssText = 'background: linear-gradient(135deg, #06D6A0, #059669); font-size: 1.25rem; padding: 1rem;';
    doneBtn.textContent = '✅ I\'m Done! Next Singer!';
    doneBtn.addEventListener('click', completeMySong);

    performerActions.appendChild(header);
    performerActions.appendChild(currentSongInfo);
    performerActions.appendChild(doneBtn);

  } else if (isMyTurn) {
    // Show "Start My Song" button - no one is performing
    performerActions.style.display = 'block';
    performerActions.style.background = 'linear-gradient(135deg, rgba(247, 37, 133, 0.15), rgba(114, 9, 183, 0.15))';
    performerActions.style.border = '2px solid #F72585';
    performerActions.style.animation = 'pulse 2s infinite';

    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 1rem;';
    header.innerHTML = '<div style="font-size: 2rem;">🔥</div><div style="font-size: 1.5rem; font-weight: 700; color: #F72585;">YOU\'RE UP!</div>';

    const mySong = currentQueue[0];
    const songInfo = document.createElement('div');
    songInfo.style.cssText = 'text-align: center; margin-bottom: 1rem; font-size: 1rem; color: #5C5F7B;';
    songInfo.textContent = mySong ? mySong.songTitle : '';

    const startBtn = document.createElement('button');
    startBtn.className = 'btn btn-hot btn-block';
    startBtn.style.cssText = 'font-size: 1.25rem; padding: 1rem; animation: pulse 1s infinite;';
    startBtn.textContent = '🎤 START MY SONG!';
    startBtn.addEventListener('click', startMySong);

    performerActions.appendChild(header);
    performerActions.appendChild(songInfo);
    performerActions.appendChild(startBtn);

  } else if (imFirstInQueue && currentlyPlaying && currentlyPlaying.startedAt) {
    // I'm next but someone is performing - show waiting/override UI
    const startedAt = new Date(currentlyPlaying.startedAt);
    const elapsedMs = Date.now() - startedAt.getTime();
    const elapsedMinutes = elapsedMs / 1000 / 60;
    const canOverride = elapsedMinutes >= SONG_TIMEOUT_MINUTES;

    performerActions.style.display = 'block';
    performerActions.style.animation = '';

    if (canOverride) {
      // Can take over!
      performerActions.style.background = 'linear-gradient(135deg, rgba(255, 159, 28, 0.15), rgba(255, 107, 107, 0.15))';
      performerActions.style.border = '2px solid #FF9F1C';

      const header = document.createElement('div');
      header.style.cssText = 'text-align: center; margin-bottom: 1rem;';
      header.innerHTML = '<div style="font-size: 2rem;">⏰</div><div style="font-size: 1.25rem; font-weight: 700; color: #FF9F1C;">YOU\'RE UP NEXT!</div>';

      const info = document.createElement('div');
      info.style.cssText = 'text-align: center; margin-bottom: 1rem; font-size: 0.9rem; color: #5C5F7B;';
      info.textContent = `Previous performer has been singing for ${Math.floor(elapsedMinutes)} minutes`;

      const startBtn = document.createElement('button');
      startBtn.className = 'btn btn-block';
      startBtn.style.cssText = 'background: linear-gradient(135deg, #FF9F1C, #FF6B6B); font-size: 1.25rem; padding: 1rem;';
      startBtn.textContent = '🎤 START MY SONG NOW!';
      startBtn.addEventListener('click', startMySong);

      performerActions.appendChild(header);
      performerActions.appendChild(info);
      performerActions.appendChild(startBtn);
    } else {
      // Still waiting
      performerActions.style.background = 'linear-gradient(135deg, rgba(76, 201, 240, 0.1), rgba(67, 97, 238, 0.1))';
      performerActions.style.border = '2px solid #4CC9F0';

      const remainingMs = (SONG_TIMEOUT_MINUTES * 60 * 1000) - elapsedMs;
      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

      const header = document.createElement('div');
      header.style.cssText = 'text-align: center; margin-bottom: 1rem;';
      header.innerHTML = '<div style="font-size: 2rem;">⏳</div><div style="font-size: 1.25rem; font-weight: 700; color: #4361EE;">YOU\'RE UP NEXT!</div>';

      const info = document.createElement('div');
      info.style.cssText = 'text-align: center; margin-bottom: 0.5rem; font-size: 0.9rem; color: #5C5F7B;';
      info.textContent = `${currentlyPlaying.guestName} is performing`;

      const countdown = document.createElement('div');
      countdown.style.cssText = 'text-align: center; font-size: 1rem; color: #4361EE; font-weight: 600;';
      countdown.textContent = `Can take over in ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;

      performerActions.appendChild(header);
      performerActions.appendChild(info);
      performerActions.appendChild(countdown);

      // Update countdown every second
      setTimeout(() => updatePerformerStatus(), 1000);
    }
  } else {
    // Hide if not my turn
    performerActions.style.display = 'none';
  }
}

// Start my song
async function startMySong() {
  try {
    const response = await fetch('/api/song/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });

    const data = await response.json();

    if (data.success) {
      showToast("🎤 LET'S GO! You're on!");
    } else {
      showToast(data.error || 'Could not start song');
    }
  } catch (error) {
    console.error('Start song error:', error);
    showToast('Something went wrong');
  }
}

// Complete my song
async function completeMySong() {
  try {
    const response = await fetch('/api/song/done', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });

    const data = await response.json();

    if (data.success) {
      amIPerforming = false;
      showToast("🎉 Great job! You rocked it!");
      updatePerformerStatus();
    } else {
      showToast(data.error || 'Could not complete song');
    }
  } catch (error) {
    console.error('Complete song error:', error);
    showToast('Something went wrong');
  }
}

// Toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #F72585, #7209B7);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 16px;
    z-index: 2000;
    animation: fadeIn 0.3s ease;
    box-shadow: 0 8px 32px rgba(247, 37, 133, 0.4);
    text-align: center;
    max-width: 90%;
    font-weight: 600;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    to { opacity: 0; transform: translateX(-50%) translateY(20px); }
  }
`;
document.head.appendChild(style);

// Initialize
checkRegistration();

// Fun: Random loading message
function setRandomLoadingMessage() {
  const loadingTexts = document.querySelectorAll('.loading-messages');
  loadingTexts.forEach(el => {
    el.textContent = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
  });
}
setRandomLoadingMessage();
