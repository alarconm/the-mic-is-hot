import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ============ PERSISTENT DATA STORE ============
// JSON file persistence - survives restarts!

const DATA_FILE = path.join(__dirname, 'database', 'party-data.json');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Load existing data or create fresh
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Convert guests array back to Map
      const guests = new Map(data.guests || []);
      return {
        guests,
        songs: data.songs || [],
        songIdCounter: data.songIdCounter || 1,
        stats: data.stats || {
          totalSongsPlayed: 0,
          partyStartedAt: new Date().toISOString(),
          isPaused: false,
          currentSongId: null
        }
      };
    }
  } catch (error) {
    console.error('Error loading data, starting fresh:', error.message);
  }

  return {
    guests: new Map(),
    songs: [],
    songIdCounter: 1,
    stats: {
      totalSongsPlayed: 0,
      partyStartedAt: new Date().toISOString(),
      isPaused: false,
      currentSongId: null
    }
  };
}

// Save data to file
function saveData() {
  try {
    const data = {
      guests: Array.from(store.guests.entries()),
      songs: store.songs,
      songIdCounter: store.songIdCounter,
      stats: store.stats
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error.message);
  }
}

// Auto-save every 30 seconds
setInterval(saveData, 30000);

// Save on process exit
process.on('SIGINT', () => {
  console.log('\nSaving data before exit...');
  saveData();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('\nSaving data before exit...');
  saveData();
  process.exit();
});

// Initialize store from file
const store = loadData();
console.log(`Loaded ${store.guests.size} guests, ${store.songs.length} songs`);

// ============ HELPER FUNCTIONS ============

// Snarky intro generator
const roasts = {
  generic: [
    "Please welcome {name}, who genuinely believes they can hit those notes...",
    "Next up: {name}, attempting '{song}'. The key word being 'attempting'...",
    "{name} has chosen '{song}'. Bold strategy, let's see how it plays out.",
    "Coming to the stage: {name}! Their confidence is... admirable.",
    "Put your hands together for {name}, who's about to make some... choices.",
    "And now, {name} will demonstrate why karaoke was invented: so we could all suffer together.",
    "{name} approaches the mic. The neighbors have been warned.",
    "Ladies and gentlemen, {name} is about to prove that enthusiasm beats talent. Maybe.",
  ],
  vip: [
    "THE BIRTHDAY QUEEN APPROACHES! All hail {name}!",
    "Make way for the woman of the hour: {name}!",
    "It's HER party and she'll sing if she wants to! Welcome {name}!",
    "The legend herself graces us with her presence: {name}!",
    "Clear the stage! Royalty is about to perform! {name}, take it away!",
  ],
  returning: [
    "{name} is back for more! Apparently one wasn't enough...",
    "Oh look, {name} again. Someone's feeling confident tonight!",
    "{name} returns! The crowd goes... well, the crowd goes.",
    "Back by popular demand (their own demand): {name}!",
  ]
};

function generateRoast(guestName, songTitle, isVip, songsCompleted) {
  let pool;
  if (isVip) {
    pool = roasts.vip;
  } else if (songsCompleted > 0) {
    pool = roasts.returning;
  } else {
    pool = roasts.generic;
  }
  const template = pool[Math.floor(Math.random() * pool.length)];
  return template.replace('{name}', guestName).replace('{song}', songTitle);
}

// Extract YouTube video ID from various URL formats
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

// Get queue sorted by: songs_completed ASC, then submitted_at ASC
function getQueue() {
  return store.songs
    .filter(s => s.status === 'queued')
    .map(s => {
      const guest = store.guests.get(s.guestId);
      return {
        ...s,
        songs_completed: guest?.songsCompleted || 0,
        is_vip: guest?.isVip || false,
        skip_used: guest?.skipUsed || false
      };
    })
    .sort((a, b) => {
      // First: position override (VIP skip)
      if (a.positionOverride !== null && b.positionOverride === null) return -1;
      if (a.positionOverride === null && b.positionOverride !== null) return 1;
      if (a.positionOverride !== null && b.positionOverride !== null) {
        return a.positionOverride - b.positionOverride;
      }
      // Second: fewer songs completed = higher priority
      if (a.songs_completed !== b.songs_completed) {
        return a.songs_completed - b.songs_completed;
      }
      // Third: first come first serve
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });
}

// Get current playing song
function getCurrentSong() {
  const song = store.songs.find(s => s.status === 'current');
  if (!song) return null;

  const guest = store.guests.get(song.guestId);
  return {
    ...song,
    songs_completed: guest?.songsCompleted || 0,
    is_vip: guest?.isVip || false
  };
}

// Get stats
function getStats() {
  const totalQueued = store.songs.filter(s => s.status === 'queued').length;
  const totalCompleted = store.songs.filter(s => s.status === 'completed').length;
  const drunkLevel = Math.min(100, Math.floor(totalCompleted * 5));

  return {
    ...store.stats,
    totalQueued,
    totalCompleted,
    drunkOMeter: drunkLevel
  };
}

// Get hall of fame/shame
function getHallOfFame() {
  const completedSongs = store.songs.filter(s => s.status === 'completed');

  // Count songs per guest
  const songCounts = {};
  completedSongs.forEach(s => {
    songCounts[s.guestName] = (songCounts[s.guestName] || 0) + 1;
  });

  // Find mic hog
  let micHog = null;
  let maxSongs = 0;
  for (const [name, count] of Object.entries(songCounts)) {
    if (count > maxSongs) {
      maxSongs = count;
      micHog = { guest_name: name, song_count: count };
    }
  }

  // Count one hit wonders
  const oneHitWonderCount = Object.values(songCounts).filter(c => c === 1).length;

  return {
    micHog,
    oneHitWonderCount
  };
}

// Broadcast queue update to all clients
function broadcastQueueUpdate() {
  const queue = getQueue();
  const current = getCurrentSong();
  const stats = getStats();
  const hallOfFame = getHallOfFame();

  io.emit('queue-updated', {
    queue,
    current,
    stats,
    hallOfFame
  });
}

// ============ API ROUTES ============

// Get queue
app.get('/api/queue', (req, res) => {
  const queue = getQueue();
  const current = getCurrentSong();
  const stats = getStats();
  const hallOfFame = getHallOfFame();
  res.json({ queue, current, stats, hallOfFame });
});

// Get or create guest
app.get('/api/guest/:deviceId', (req, res) => {
  const { deviceId } = req.params;
  const guest = store.guests.get(deviceId);

  if (!guest) {
    res.json({ guest: null });
    return;
  }

  const songs = store.songs
    .filter(s => s.guestId === deviceId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  res.json({ guest, songs });
});

// Register guest
app.post('/api/guest/register', (req, res) => {
  const { deviceId, name } = req.body;

  if (!deviceId || !name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Device ID and name required' });
  }

  // Check if this is Kristin (VIP - the birthday girl!)
  const isVip = name.toLowerCase().includes('kristin');

  const guest = {
    id: deviceId,
    name: name.trim(),
    songsCompleted: 0,
    isVip,
    skipUsed: false,
    createdAt: new Date().toISOString()
  };

  // Update or create
  const existing = store.guests.get(deviceId);
  if (existing) {
    guest.songsCompleted = existing.songsCompleted;
    guest.skipUsed = existing.skipUsed;
  }

  store.guests.set(deviceId, guest);
  saveData();
  res.json({ guest });
});

// Submit a song
app.post('/api/songs', (req, res) => {
  const { deviceId, songTitle, youtubeUrl } = req.body;

  if (!deviceId || !songTitle || !youtubeUrl) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const guest = store.guests.get(deviceId);
  if (!guest) {
    return res.status(400).json({ error: 'Guest not found. Please register first.' });
  }

  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  const song = {
    id: store.songIdCounter++,
    guestId: deviceId,
    guestName: guest.name,
    songTitle: songTitle.trim(),
    youtubeUrl,
    youtubeId,
    status: 'queued',
    positionOverride: null,
    submittedAt: new Date().toISOString(),
    completedAt: null
  };

  store.songs.push(song);
  saveData();
  broadcastQueueUpdate();
  res.json({ success: true, songId: song.id });
});

// Send reaction
app.post('/api/reaction', (req, res) => {
  const { emoji, guestName } = req.body;

  if (!emoji) {
    return res.status(400).json({ error: 'Emoji required' });
  }

  io.emit('reaction', { emoji, guestName: guestName || 'Anonymous' });
  res.json({ success: true });
});

// ============ KJ CONTROL ROUTES ============

// Advance to next song (mark current as complete)
app.post('/api/kj/advance', (req, res) => {
  const current = getCurrentSong();

  if (current) {
    // Mark current as completed
    const song = store.songs.find(s => s.id === current.id);
    if (song) {
      song.status = 'completed';
      song.completedAt = new Date().toISOString();
    }

    // Increment guest's songs_completed
    const guest = store.guests.get(current.guestId);
    if (guest) {
      guest.songsCompleted++;
    }

    store.stats.totalSongsPlayed++;
  }

  // Get next in queue
  const queue = getQueue();
  if (queue.length > 0) {
    const next = queue[0];
    const song = store.songs.find(s => s.id === next.id);
    if (song) {
      song.status = 'current';
    }
    store.stats.currentSongId = next.id;

    // Generate roast intro
    const guest = store.guests.get(next.guestId);
    const roast = generateRoast(next.guestName, next.songTitle, guest?.isVip, guest?.songsCompleted || 0);

    io.emit('now-playing', {
      song: next,
      roast,
      isVip: guest?.isVip || false
    });
  } else {
    store.stats.currentSongId = null;
  }

  saveData();
  broadcastQueueUpdate();
  res.json({ success: true });
});

// Skip current performer
app.post('/api/kj/skip', (req, res) => {
  const current = getCurrentSong();

  if (current) {
    const song = store.songs.find(s => s.id === current.id);
    if (song) {
      song.status = 'skipped';
      song.completedAt = new Date().toISOString();
    }
  }

  // Get next
  const queue = getQueue();
  if (queue.length > 0) {
    const next = queue[0];
    const song = store.songs.find(s => s.id === next.id);
    if (song) {
      song.status = 'current';
    }

    const guest = store.guests.get(next.guestId);
    const roast = generateRoast(next.guestName, next.songTitle, guest?.isVip, guest?.songsCompleted || 0);

    io.emit('now-playing', {
      song: next,
      roast,
      isVip: guest?.isVip || false
    });
  }

  saveData();
  broadcastQueueUpdate();
  res.json({ success: true });
});

// Remove a song from queue
app.post('/api/kj/remove/:songId', (req, res) => {
  const songId = parseInt(req.params.songId);
  const index = store.songs.findIndex(s => s.id === songId && s.status === 'queued');
  if (index !== -1) {
    store.songs.splice(index, 1);
  }
  saveData();
  broadcastQueueUpdate();
  res.json({ success: true });
});

// Move song in queue (VIP skip or manual reorder)
app.post('/api/kj/move', (req, res) => {
  const { songId, position } = req.body;
  const song = store.songs.find(s => s.id === songId);
  if (song) {
    song.positionOverride = position;
  }
  saveData();
  broadcastQueueUpdate();
  res.json({ success: true });
});

// Pause/unpause queue
app.post('/api/kj/pause', (req, res) => {
  store.stats.isPaused = !store.stats.isPaused;
  io.emit('pause-state', { isPaused: store.stats.isPaused });
  res.json({ success: true, isPaused: store.stats.isPaused });
});

// Start the party (set first song as current)
app.post('/api/kj/start', (req, res) => {
  const current = getCurrentSong();
  if (current) {
    return res.json({ success: true, message: 'Party already started!' });
  }

  const queue = getQueue();
  if (queue.length > 0) {
    const first = queue[0];
    const song = store.songs.find(s => s.id === first.id);
    if (song) {
      song.status = 'current';
    }

    const guest = store.guests.get(first.guestId);
    const roast = generateRoast(first.guestName, first.songTitle, guest?.isVip, guest?.songsCompleted || 0);

    io.emit('now-playing', {
      song: first,
      roast,
      isVip: guest?.isVip || false
    });
    saveData();
    broadcastQueueUpdate();
  }

  res.json({ success: true });
});

// Reset party (start fresh)
app.post('/api/kj/reset', (req, res) => {
  // Clear all songs
  store.songs = [];
  store.songIdCounter = 1;

  // Reset all guests' song counts but keep them registered
  for (const [deviceId, guest] of store.guests) {
    guest.songsCompleted = 0;
    guest.skipUsed = false;
  }

  // Reset stats
  store.stats = {
    totalSongsPlayed: 0,
    partyStartedAt: new Date().toISOString(),
    isPaused: false,
    currentSongId: null
  };

  saveData();
  broadcastQueueUpdate();
  io.emit('party-reset', { message: 'Party has been reset!' });
  res.json({ success: true, message: 'Party reset! Ready for a fresh start.' });
});

// Guest starts their own song (self-service flow)
app.post('/api/song/start', (req, res) => {
  const { deviceId, songId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID required' });
  }

  const guest = store.guests.get(deviceId);
  if (!guest) {
    return res.status(400).json({ error: 'Guest not found' });
  }

  // Check if there's already a current song
  const current = getCurrentSong();
  if (current) {
    return res.status(400).json({ error: 'Someone is already performing!' });
  }

  // Get the queue
  const queue = getQueue();
  if (queue.length === 0) {
    return res.status(400).json({ error: 'Queue is empty' });
  }

  // Check if this guest's song is first in queue
  const firstSong = queue[0];
  if (firstSong.guestId !== deviceId) {
    return res.status(403).json({ error: "It's not your turn yet!" });
  }

  // If songId provided, make sure it matches the first song
  if (songId && firstSong.id !== songId) {
    return res.status(400).json({ error: 'This is not your next song' });
  }

  // Start the song - mark it as current
  const song = store.songs.find(s => s.id === firstSong.id);
  if (song) {
    song.status = 'current';
  }
  store.stats.currentSongId = firstSong.id;

  // Generate roast intro
  const roast = generateRoast(firstSong.guestName, firstSong.songTitle, guest.isVip, guest.songsCompleted);

  io.emit('now-playing', {
    song: firstSong,
    roast,
    isVip: guest.isVip || false
  });

  saveData();
  broadcastQueueUpdate();
  res.json({ success: true, message: "You're up! Get to the stage!" });
});

// Guest marks their song as done (self-service advance)
app.post('/api/song/done', (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID required' });
  }

  const current = getCurrentSong();
  if (!current) {
    return res.status(400).json({ error: 'No song is currently playing' });
  }

  // Only the performer or KJ can mark as done
  if (current.guestId !== deviceId) {
    return res.status(403).json({ error: "This isn't your song!" });
  }

  // Mark current as completed
  const song = store.songs.find(s => s.id === current.id);
  if (song) {
    song.status = 'completed';
    song.completedAt = new Date().toISOString();
  }

  // Increment guest's songs_completed
  const guest = store.guests.get(current.guestId);
  if (guest) {
    guest.songsCompleted++;
  }

  store.stats.totalSongsPlayed++;
  store.stats.currentSongId = null;

  saveData();
  broadcastQueueUpdate();

  // Notify the next person in queue
  const queue = getQueue();
  if (queue.length > 0) {
    io.emit('your-turn-soon', { guestId: queue[0].guestId, songId: queue[0].id });
  }

  res.json({ success: true, message: 'Great job! 🎤' });
});

// VIP skip (Kristen can use this once)
app.post('/api/vip/skip', (req, res) => {
  const { deviceId, songId } = req.body;

  const guest = store.guests.get(deviceId);
  if (!guest || !guest.isVip) {
    return res.status(403).json({ error: 'VIP only!' });
  }

  if (guest.skipUsed) {
    return res.status(400).json({ error: 'You already used your skip power!' });
  }

  // Move song to front with override
  const song = store.songs.find(s => s.id === songId);
  if (song) {
    song.positionOverride = -1;
  }
  guest.skipUsed = true;

  saveData();
  broadcastQueueUpdate();
  io.emit('vip-skip', { guestName: guest.name });
  res.json({ success: true });
});

// ============ SOCKET.IO ============

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state
  socket.emit('queue-updated', {
    queue: getQueue(),
    current: getCurrentSong(),
    stats: getStats(),
    hallOfFame: getHallOfFame()
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ============ SERVE PAGES ============

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/guest', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'guest.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.get('/kj', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'kj.html'));
});

// Start server
const PORT = process.env.PORT || 3333;
httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║       🎤 THE MIC IS HOT 🔥                ║
  ║   Karaoke Management for Kristin's Party  ║
  ╠═══════════════════════════════════════════╣
  ║  Server running on port ${PORT}              ║
  ║                                           ║
  ║  Routes:                                  ║
  ║  • /        - QR code landing page        ║
  ║  • /guest   - Guest mobile view           ║
  ║  • /display - Party display (projector)   ║
  ║  • /kj      - KJ control panel            ║
  ╚═══════════════════════════════════════════╝
  `);
});
