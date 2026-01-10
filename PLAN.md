# Kristin's 40th Birthday Karaoke App - Build Plan

## Project: "The Mic Is Hot" 🎤🔥

**Kristin's Birthday**: February 17th, 2026
**Party Date**: February 21st, 2026 (Saturday)
**Expected Guests**: 20-40 people

---

## Overview

A web app that manages karaoke at Kristin's 40th birthday party. Features a QR code entry for guests, smart queue management that ensures fair rotation, and a party display screen with YouTube video playback. Packed with adult humor and delightful easter eggs.

---

## Core Features

### 1. Guest Mobile Experience (Phone View)
- **QR Code Entry**: Scan to join the party
- **Zero-friction signup**: Device-based magic ID (auto-generated, stored in localStorage)
- **Song Submission Form**:
  - Your name (displayed on screen)
  - Song title
  - YouTube video picker (embedded search modal)
- **Live Queue View**: See your position, how many ahead of you
- **Real-time updates**: Watch the queue update live via WebSockets
- **Emoji Reactions**: Send reactions that pop up on the main screen

### 2. Main Party Display (Projector/TV Screen)
- **Current Performer**: Big display of who's up with their song
- **90-Second Countdown Timer**: "Get your ass up here!" countdown
- **YouTube Video Player**: Embedded player for karaoke videos
- **Queue Preview**: Next 3-5 performers visible
- **Emoji Reaction Overlay**: Floating emojis from the audience
- **Drunk-o-meter**: Party energy bar that fills as more songs get sung
- **Roast Mode Intros**: Snarky AI-generated performer introductions
- **Hall of Fame/Shame**: Sidebar showing top singers of the night

### 3. KJ (Host) Controls
- **Play/Pause** current video
- **Skip** to next performer
- **Remove** songs from queue
- **Manual Reorder**: Drag-and-drop queue management
- **Mark as Done**: Complete current performance, advance queue
- **Pause Queue**: Stop the timer/auto-advance
- **Emergency Mode**: Quick mute/stop everything

### 4. Smart Queue Algorithm
```
Priority Order:
1. First, sort by songs_completed (ascending) - fewer songs = higher priority
2. Then, sort by submission_time (ascending) - first come first serve within same count

Example:
- Katie (0 songs done, signed up 8:00) -> Position 1
- Mike (0 songs done, signed up 8:05) -> Position 2
- Kristin (1 song done, signed up 7:55) -> Position 3
- Susan (1 song done, signed up 8:10) -> Position 4
- Kristin's 2nd song (signed up 8:02) -> Position 5 (after her 1st completes)
```

---

## Tech Stack (Replit-Optimized)

### Backend
- **Node.js + Express**: Simple, fast, Replit-friendly
- **Socket.io**: Real-time bidirectional communication
- **SQLite (better-sqlite3)**: Lightweight, file-based, perfect for single-event use
- **No auth overhead**: Device IDs only, no passwords/accounts

### Frontend
- **Vanilla JS + HTML/CSS**: No build step needed, instant Replit deploy
- **Tailwind CSS (CDN)**: Quick styling without setup
- **Socket.io Client**: Real-time updates
- **YouTube IFrame API**: Embedded video playback

### Deployment
- **Replit**: Single click deploy
- **Environment**: Node.js 20+
- **No external services needed** (except YouTube embeds)

---

## File Structure

```
BirthdayKaraoke/
├── server.js                 # Express + Socket.io server
├── package.json
├── .replit                   # Replit config
├── replit.nix               # Replit dependencies
├── database/
│   └── karaoke.db           # SQLite database (auto-created)
├── public/
│   ├── index.html           # Landing page with QR code
│   ├── guest.html           # Mobile guest view
│   ├── display.html         # Main party display (projector)
│   ├── kj.html              # KJ control panel
│   ├── css/
│   │   └── styles.css       # Custom styles + Tailwind overrides
│   ├── js/
│   │   ├── guest.js         # Guest mobile logic
│   │   ├── display.js       # Party display logic
│   │   ├── kj.js            # KJ controls logic
│   │   ├── queue.js         # Shared queue rendering
│   │   └── reactions.js     # Emoji reaction system
│   └── assets/
│       ├── logo.svg         # App logo
│       ├── qr-code.png      # Generated QR code
│       └── sounds/          # Sound effects (optional)
└── utils/
    ├── roasts.js            # Snarky intro generator
    └── drunkometer.js       # Party energy calculator
```

---

## Database Schema

```sql
-- Guests (device-based identification)
CREATE TABLE guests (
    id TEXT PRIMARY KEY,           -- Auto-generated device UUID
    name TEXT NOT NULL,
    songs_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Song Queue
CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,       -- Denormalized for quick display
    song_title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    youtube_id TEXT NOT NULL,       -- Extracted video ID
    status TEXT DEFAULT 'queued',   -- queued, current, completed, skipped
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (guest_id) REFERENCES guests(id)
);

-- Reactions (for the emoji system)
CREATE TABLE reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emoji TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Party Stats
CREATE TABLE stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row
    total_songs_played INTEGER DEFAULT 0,
    party_started_at DATETIME,
    drunk_o_meter INTEGER DEFAULT 0         -- 0-100 party energy
);
```

---

## API Endpoints

### REST API
```
GET  /api/queue              # Get current queue (sorted properly)
POST /api/songs              # Submit a new song
GET  /api/guest/:deviceId    # Get guest info and their songs
POST /api/reaction           # Send an emoji reaction

# KJ Controls
POST /api/kj/advance         # Mark current as done, go to next
POST /api/kj/skip            # Skip current performer
POST /api/kj/remove/:songId  # Remove a song from queue
POST /api/kj/reorder         # Reorder queue manually
POST /api/kj/pause           # Pause/unpause the queue
```

### WebSocket Events
```
Server -> Client:
  'queue-updated'      # Queue changed, re-render
  'now-playing'        # New song is current
  'reaction'           # Someone sent an emoji
  'timer-tick'         # Countdown update
  'drunk-o-meter'      # Party energy update

Client -> Server:
  'submit-song'        # Guest submits a song
  'send-reaction'      # Guest sends emoji
  'kj-command'         # KJ control action
```

---

## UI/UX Design Notes

### Color Scheme ("The Mic Is Hot" Theme)
- **Primary**: Fiery orange-red (#FF4500) - Hot mic energy
- **Secondary**: Electric pink (#FF1493) - Party vibes
- **Accent**: Gold/yellow (#FFD700) - Heat, flames, celebration
- **Background**: Dark charcoal (#1A1A2E) - Makes colors pop, stage lighting feel
- **Glow effects**: Neon gradients for that "hot" aesthetic
- **Text**: White/cream for readability

### Typography
- **Headlines**: Bold, fun, slightly irreverent
- **Body**: Clean, readable even after drinks

### Easter Eggs & Fun Touches
1. **Loading messages** rotate through party phrases:
   - "Warming up the vocal cords..."
   - "Judging your song choice..."
   - "Alerting the neighbors..."
   - "Preparing for auditory assault..."

2. **Empty queue message**:
   - "No songs? What kind of party is this?!"
   - "The mic is lonely. Don't be shy."

3. **Countdown warnings**:
   - 90 sec: "Your moment approaches..."
   - 60 sec: "Get ready, superstar!"
   - 30 sec: "WHERE ARE YOU?!"
   - 10 sec: "LAST CALL! Move your ass!"

4. **Roast mode intros** (AI-generated based on song choice):
   - "Next up: [Name], attempting [Song]. The key word being 'attempting'..."
   - "Please welcome [Name], who genuinely believes they can hit those notes..."
   - "[Name] has chosen [Song]. Bold strategy, let's see how it plays out."

5. **Drunk-o-meter levels**:
   - 0-20%: "Sober Karaoke (Boring)"
   - 20-40%: "Liquid Courage Activated"
   - 40-60%: "Peak Performance Zone"
   - 60-80%: "No Fucks Given"
   - 80-100%: "Legendary Status"

6. **Hall of Fame/Shame categories**:
   - "The Mic Hog" (most songs)
   - "One Hit Wonder" (only sang once)
   - "The DJ's Nightmare" (longest songs)
   - "Speed Demon" (shortest songs)

7. **VIP Birthday Girl Mode (Kristin)**:
   - Special sparkly intro when it's her turn
   - Can skip the line ONCE (use wisely!)
   - Confetti explosion animation when she finishes a song
   - Custom "Birthday Queen" badge next to her name in queue
   - Extra celebratory roast intros: "The woman of the hour approaches..."

---

## Build Phases

### Phase 1: Foundation (Core Functionality)
- [ ] Project setup (package.json, Replit config)
- [ ] Express server with Socket.io
- [ ] SQLite database setup
- [ ] Basic API endpoints
- [ ] Device ID generation and storage

### Phase 2: Guest Experience
- [ ] QR code landing page
- [ ] Guest mobile view (responsive)
- [ ] Song submission form
- [ ] YouTube search/preview modal
- [ ] Live queue display
- [ ] Real-time updates via WebSocket

### Phase 3: Party Display
- [ ] Main display layout (projector-optimized)
- [ ] YouTube embedded player
- [ ] Current performer display
- [ ] 90-second countdown timer
- [ ] Queue preview sidebar
- [ ] Fullscreen mode

### Phase 4: KJ Controls
- [ ] Control panel interface
- [ ] Play/pause/skip controls
- [ ] Queue management (remove, reorder)
- [ ] Timer pause/reset
- [ ] Emergency stop

### Phase 5: Fun & Polish
- [ ] Emoji reaction system
- [ ] Reaction overlay animation
- [ ] Drunk-o-meter
- [ ] Roast mode intros
- [ ] Hall of Fame/Shame
- [ ] Easter egg messages
- [ ] Sound effects (optional)
- [ ] Final styling and animations

### Phase 6: Deploy & Test
- [ ] Replit deployment configuration
- [ ] Generate QR code for party URL
- [ ] Mobile testing
- [ ] Load testing (30+ simultaneous users)
- [ ] Final walkthrough

---

## Estimated Components

1. **server.js** (~200 lines) - Express + Socket.io + API
2. **public/guest.html** + **guest.js** (~300 lines) - Mobile experience
3. **public/display.html** + **display.js** (~400 lines) - Party display
4. **public/kj.html** + **kj.js** (~250 lines) - KJ controls
5. **public/css/styles.css** (~300 lines) - All styling
6. **utils/roasts.js** (~50 lines) - Intro generator
7. **Shared modules** (~100 lines) - Queue, reactions

---

## Questions Answered

| Question | Answer |
|----------|--------|
| App name | "The Mic Is Hot" 🎤🔥 |
| User identification | Device-based magic (auto UUID in localStorage) |
| KJ controls | Full controls (play/skip/remove/reorder/pause) |
| Fun features | ALL: Reactions, Drunk-o-meter, Roasts, Hall of Fame |
| Birthday girl | VIP Mode (special intros, skip line once, confetti) |
| Guest count | 20-40 people |
| Party date | February 21st, 2026 |
| Kristin's birthday | February 17th, 2026 |
| YouTube handling | Embedded search modal in the app |
| Deployment | Replit (simple, no extra config) |

---

## Ready to Build!

**"The Mic Is Hot"** - A karaoke management app for Kristin's birthday party.

This plan covers everything discussed in the audio recording plus all the fun extras. The app will be:
- **Frictionless** for guests (scan QR, type name, pick song, done)
- **Powerful** for the KJ (full queue control, skip, reorder, pause)
- **Hilarious** for everyone (roasts, reactions, drunk-o-meter, hall of fame)
- **Special** for Kristin (VIP mode with confetti and skip privileges)
- **Reliable** for the party (real-time WebSocket updates, SQLite persistence)

Let's make Kristin's party unforgettable! 🎤🔥
