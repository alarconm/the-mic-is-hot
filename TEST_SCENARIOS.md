# The Mic Is Hot - Comprehensive Test Scenarios

## Application Overview

**Application:** "The Mic Is Hot" - Karaoke Management System for Kristin's Birthday Party
**Server:** http://localhost:3333
**Pages:**
- `/` - QR code landing page
- `/guest` - Guest mobile view (register, add songs, view queue, send reactions)
- `/kj` - KJ control panel (manage queue, start party, advance songs, skip, pause)
- `/display` - Party display for projector (current performer, countdown, queue preview, drunk-o-meter)

---

## 1. User Stories

### 1.1 Guest User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| GU-001 | As a guest, I want to scan a QR code to join the party, so that I can easily access the sign-up page on my phone | QR code on landing page links to `/guest`, scannable by any phone camera |
| GU-002 | As a guest, I want to register with my name, so that my songs are associated with my identity | Registration form accepts name, creates localStorage UUID, stores guest in database |
| GU-003 | As a guest, I want to search for karaoke videos on YouTube, so that I can find the right backing track | Search button opens modal with YouTube search link |
| GU-004 | As a guest, I want to submit a song with a YouTube URL, so that I can be added to the queue | Song submission accepts title + YouTube URL, validates URL format, adds to queue |
| GU-005 | As a guest, I want to see a preview of the YouTube video I selected, so that I know I chose the right one | Thumbnail preview appears when valid YouTube URL is pasted |
| GU-006 | As a guest, I want to view the current queue, so that I know when my turn is coming | Queue tab shows ordered list of upcoming performers |
| GU-007 | As a guest, I want to see my position in the queue, so that I know how long until I perform | Position indicator shows "#X in line" |
| GU-008 | As a guest, I want to see all my submitted songs and their status, so that I can track my performances | "My Songs" tab shows all submissions with status badges |
| GU-009 | As a guest, I want to send emoji reactions during performances, so that I can cheer on my friends | Reaction buttons send emojis that appear on display screen |
| GU-010 | As a guest, I want to be notified when it's my turn, so that I don't miss my performance | Toast notification appears when guest's song becomes current |
| GU-011 | As a guest with "kristin" in my name (VIP), I want special recognition, so that the birthday girl stands out | VIP banner appears, gold styling on queue items |
| GU-012 | As the VIP (Kristin), I want to use a one-time skip power, so that I can jump to the front of the queue | VIP skip button moves song to position -1, can only be used once |
| GU-013 | As a guest, I want my registration to persist across page refreshes, so that I don't have to re-register | localStorage UUID persists guest identity |
| GU-014 | As a guest, I want to add multiple songs, so that I can perform more than once | No limit on song submissions per guest |
| GU-015 | As a guest, I want to see who is currently performing, so that I can watch them | Current performer info visible in queue tab |

### 1.2 KJ (Karaoke Jockey) User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| KJ-001 | As the KJ, I want to start the party, so that the first performer is called up | "Start Party" button sets first queued song to current |
| KJ-002 | As the KJ, I want to advance to the next song after a performance, so that the show continues | "Song Done - Next" marks current as complete, advances queue |
| KJ-003 | As the KJ, I want to skip a performer who's not ready, so that the party keeps moving | "Skip Performer" marks current as skipped, advances queue |
| KJ-004 | As the KJ, I want to pause the queue, so that I can make announcements or take breaks | "Pause Queue" toggles pause state, shows overlay on display |
| KJ-005 | As the KJ, I want an emergency stop button, so that I can quickly halt everything | Emergency stop pauses queue and alerts user |
| KJ-006 | As the KJ, I want to see party statistics, so that I know how the night is going | Stats show queued count, completed count, drunk-o-meter |
| KJ-007 | As the KJ, I want to see the current performer's info, so that I can announce them | Now playing card shows name, song, VIP status |
| KJ-008 | As the KJ, I want to drag and drop to reorder the queue, so that I can manage special requests | Queue items are draggable, position updates on drop |
| KJ-009 | As the KJ, I want to remove songs from the queue, so that I can handle cancellations | Remove button (X) deletes queued song |
| KJ-010 | As the KJ, I want keyboard shortcuts, so that I can control the show quickly | Space=advance, S=skip, P=pause |
| KJ-011 | As the KJ, I want to see the queue count, so that I know how many songs are left | Queue count badge shows "X songs" |
| KJ-012 | As the KJ, I want quick links to other views, so that I can test/view them easily | Links to QR page, display, guest view |
| KJ-013 | As the KJ, I want real-time queue updates, so that I see new signups immediately | WebSocket pushes queue updates automatically |

### 1.3 Display Screen User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| DS-001 | As a party host, I want a display screen for the projector, so that everyone can see what's happening | Display page shows waiting, countdown, or now playing state |
| DS-002 | As a party host, I want to see a countdown before each performer, so that they have time to get ready | 90-second countdown with escalating urgency styling |
| DS-003 | As a party host, I want to see the YouTube video playing, so that performers can sing along | Embedded YouTube player loads and plays karaoke video |
| DS-004 | As a party host, I want to see upcoming performers in a sidebar, so that guests know who's next | Queue preview shows next 8 performers |
| DS-005 | As a party host, I want to see a "drunk-o-meter", so that we can track party energy | Progress bar with funny status messages based on completed songs |
| DS-006 | As a party host, I want to see a "Hall of Fame", so that we celebrate mic hogs and one-hit wonders | Shows "The Mic Hog" (most songs) and one-hit wonder count |
| DS-007 | As a party host, I want emoji reactions to float on screen, so that the audience can participate | Reactions appear as floating animated emojis |
| DS-008 | As a party host, I want confetti for VIP performances, so that Kristin feels special | Confetti animation triggers for VIP |
| DS-009 | As a party host, I want a snarky roast/intro for each performer, so that it's entertaining | Generated roast text appears with performer info |
| DS-010 | As a party host, I want fullscreen mode, so that the display fills the projector | Double-click toggles fullscreen |
| DS-011 | As a party host, I want the cursor to hide after inactivity, so that the display looks clean | Cursor hides after 3 seconds of no movement |
| DS-012 | As a party host, I want a paused overlay, so that everyone knows when we're on break | "PAUSED" text appears when queue is paused |
| DS-013 | As a party host, I want a waiting screen when no one is performing, so that guests know to sign up | Waiting screen shows when queue is empty or not started |

### 1.4 Landing Page User Stories

| ID | User Story | Acceptance Criteria |
|----|------------|---------------------|
| LP-001 | As a party host, I want a QR code on the landing page, so that guests can easily join | QR code generated dynamically pointing to /guest |
| LP-002 | As a party host, I want navigation links to all views, so that I can access any page | Buttons link to guest, display, and KJ pages |
| LP-003 | As a party host, I want the landing page to be visually appealing, so that it sets the party mood | Animated background, sparkles, colorful gradients |

---

## 2. Use Cases

### 2.1 Guest Registration Flow

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| UC-001 | New guest registers | 1. Navigate to /guest 2. Enter name 3. Click "Let's Party!" | Registration view hidden, main view shown, name displayed |
| UC-002 | Returning guest auto-login | 1. Previously registered 2. Navigate to /guest | Skips registration, shows main view with stored name |
| UC-003 | VIP guest registers | 1. Navigate to /guest 2. Enter "Kristin" (or name containing kristin) 3. Submit | VIP banner displayed, skip power available |
| UC-004 | Guest registers with lowercase kristin | 1. Enter "kristin smith" | VIP mode activated (case insensitive check) |
| UC-005 | Guest clears localStorage and returns | 1. Clear browser data 2. Navigate to /guest | Registration form shown, treated as new guest |

### 2.2 Song Submission Flow

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| UC-006 | Submit song with valid URL | 1. Enter song title 2. Paste YouTube URL 3. Submit | Success toast, form cleared, song appears in queue |
| UC-007 | Submit song with shortened URL | 1. Enter title 2. Use youtu.be/xxx format | URL parsed correctly, song submitted |
| UC-008 | Submit song with embed URL | 1. Enter title 2. Use youtube.com/embed/xxx | URL parsed correctly, song submitted |
| UC-009 | Submit song with shorts URL | 1. Enter title 2. Use youtube.com/shorts/xxx | URL parsed correctly, song submitted |
| UC-010 | Attempt submit with invalid URL | 1. Enter title 2. Enter random text as URL | Error alert shown, form not cleared |
| UC-011 | Attempt submit without title | 1. Leave title empty 2. Enter valid URL | Form validation prevents submission |
| UC-012 | Attempt submit without URL | 1. Enter title 2. Leave URL empty | Form validation prevents submission |
| UC-013 | Preview video before submit | 1. Paste valid YouTube URL | Thumbnail and "Video found!" preview appear |

### 2.3 Queue Management Flow (KJ)

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| UC-014 | Start party with songs in queue | 1. Have songs in queue 2. Click "Start Party" | First song becomes current, now-playing emitted |
| UC-015 | Start party with empty queue | 1. No songs 2. Click "Start Party" | No action or error, remains in waiting state |
| UC-016 | Advance to next song | 1. Song currently playing 2. Click "Song Done - Next" | Current marked complete, next becomes current |
| UC-017 | Advance when queue is empty | 1. Last song playing 2. Click advance | Current marked complete, display shows waiting |
| UC-018 | Skip current performer | 1. Song playing 2. Confirm skip | Current marked skipped, next becomes current |
| UC-019 | Remove song from queue | 1. Click X on queue item 2. Confirm | Song removed, queue re-renders |
| UC-020 | Drag song to new position | 1. Drag queue item 2. Drop at new position | positionOverride set, queue reorders |
| UC-021 | Pause queue | 1. Click "Pause Queue" | Pause state toggled, display shows overlay |
| UC-022 | Resume queue | 1. While paused 2. Click "Resume Queue" | Pause state toggled, overlay hidden |
| UC-023 | Emergency stop | 1. Click "Emergency Stop" 2. Confirm | Queue paused, alert shown |

### 2.4 VIP Skip Flow

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| UC-024 | VIP uses skip power | 1. Kristin has song in queue 2. Click "Use Skip Power" 3. Confirm | Song moves to front, button disabled, notification broadcast |
| UC-025 | VIP attempts second skip | 1. Skip already used 2. Click skip button | Button disabled, no action |
| UC-026 | VIP skip with no song in queue | 1. No queued songs 2. Click skip | Alert shows error message |
| UC-027 | Non-VIP cannot access skip | 1. Regular guest 2. Check for skip button | Skip section hidden |

### 2.5 Real-time Update Flow

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| UC-028 | New song appears in queue | 1. Guest A views queue 2. Guest B submits song | Guest A's queue updates automatically |
| UC-029 | Song advanced notification | 1. Guest has song next 2. KJ advances | Toast notification on guest's device |
| UC-030 | Reaction appears on display | 1. Guest sends reaction 2. View display | Emoji floats up on display screen |
| UC-031 | Pause affects all clients | 1. KJ pauses 2. Check all views | Pause overlay/state synced everywhere |
| UC-032 | VIP skip notification | 1. VIP uses skip 2. Check all clients | VIP skip event shows notification |

### 2.6 Display Screen Flow

| ID | Use Case | Steps | Expected Result |
|----|----------|-------|-----------------|
| UC-033 | Display shows waiting state | 1. No current song 2. View /display | Waiting screen with QR prompt |
| UC-034 | Display shows countdown | 1. KJ starts/advances 2. View display | 90-second countdown begins |
| UC-035 | Countdown reaches zero | 1. Wait for countdown | Transitions to now-playing with video |
| UC-036 | VIP triggers confetti | 1. VIP performance starts | Confetti animation plays |
| UC-037 | Drunk-o-meter updates | 1. Songs completed | Percentage increases (5% per song) |
| UC-038 | Hall of fame updates | 1. Multiple songs completed | Mic hog and one-hit-wonder stats update |

---

## 3. Edge Cases

### 3.1 Input Validation Edge Cases

| ID | Edge Case | Input | Expected Behavior |
|----|-----------|-------|-------------------|
| EC-001 | Empty name registration | "" or "   " | Registration rejected |
| EC-002 | Very long name | 500+ characters | Should handle gracefully (truncate or error) |
| EC-003 | Name with special characters | "<script>alert(1)</script>" | XSS prevented, name escaped |
| EC-004 | Name with emojis | "John 🎤🔥" | Should work, display correctly |
| EC-005 | Name with only spaces | "     " | Treated as empty, rejected |
| EC-006 | Name "kristin" variations | "KRISTIN", "KrIsTiN", "kristin123" | All trigger VIP mode |
| EC-007 | Song title with HTML | "<b>My Song</b>" | HTML escaped in display |
| EC-008 | Very long song title | 1000+ characters | Handle gracefully |
| EC-009 | YouTube URL with extra params | "?v=xxx&t=120&list=yyy" | Video ID extracted correctly |
| EC-010 | YouTube URL with timestamps | "?v=xxx&t=30s" | Video ID extracted, timestamp ignored |
| EC-011 | Non-YouTube URL | "https://vimeo.com/12345" | Rejected with error message |
| EC-012 | Malformed URL | "notaurl" | Rejected with error message |
| EC-013 | Private/deleted YouTube video | Valid format but unavailable | URL accepted but video may not play |

### 3.2 Queue Algorithm Edge Cases

| ID | Edge Case | Scenario | Expected Behavior |
|----|-----------|----------|-------------------|
| EC-014 | Fair queue ordering | 3 guests, each submits 2 songs | Order: A1, B1, C1, A2, B2, C2 |
| EC-015 | Late joiner advantage | Guest joins after others have sung | Late joiner prioritized (0 songs completed) |
| EC-016 | VIP skip timing | VIP skip during countdown | Song jumps to front even mid-countdown |
| EC-017 | Multiple position overrides | Manual drag + VIP skip | Both use positionOverride, sort correctly |
| EC-018 | Same timestamp submissions | Two songs at exact same moment | Consistent ordering (by song ID) |
| EC-019 | Rapid submissions | Guest submits 10 songs quickly | All songs queued, spread throughout |

### 3.3 Session/State Edge Cases

| ID | Edge Case | Scenario | Expected Behavior |
|----|-----------|----------|-------------------|
| EC-020 | localStorage disabled | Browser blocks storage | Graceful degradation or error message |
| EC-021 | New deviceId same name | Different device, same "John" | Treated as different guest |
| EC-022 | Server restart mid-party | Server crashes and restarts | Data persisted from JSON file |
| EC-023 | WebSocket disconnect | Network interruption | Auto-reconnect, state refreshes |
| EC-024 | Multiple tabs same device | Same user opens 2 guest tabs | Same deviceId, consistent state |
| EC-025 | Stale data after reconnect | Long disconnect, many changes | Full state refresh on reconnect |

### 3.4 Concurrent User Edge Cases

| ID | Edge Case | Scenario | Expected Behavior |
|----|-----------|----------|-------------------|
| EC-026 | Simultaneous submissions | 5 guests submit at once | All songs added, queue updates |
| EC-027 | KJ action during submission | KJ advances while guest submits | Both actions processed correctly |
| EC-028 | Multiple KJ panels | Two browsers open KJ page | Both see same state, last action wins |
| EC-029 | Reaction flood | Many reactions sent rapidly | Display handles gracefully (rate limit?) |

### 3.5 Display/UI Edge Cases

| ID | Edge Case | Scenario | Expected Behavior |
|----|-----------|----------|-------------------|
| EC-030 | Queue exceeds display limit | 50+ songs in queue | Shows first 8 with "+X more" indicator |
| EC-031 | Very long guest name display | "Bartholomew Fitzgerald III" | Text truncates with ellipsis |
| EC-032 | Drunk-o-meter over 100% | 50+ songs completed | Caps at 100% |
| EC-033 | YouTube player error | Invalid video ID | Handle gracefully, show error state |
| EC-034 | Countdown interrupted | KJ pauses mid-countdown | Countdown pauses, resumes correctly |

### 3.6 Data Persistence Edge Cases

| ID | Edge Case | Scenario | Expected Behavior |
|----|-----------|----------|-------------------|
| EC-035 | Corrupted JSON file | Manual edit breaks JSON | Starts fresh, logs error |
| EC-036 | Missing database directory | Directory deleted | Recreates directory and file |
| EC-037 | File write permission error | Read-only filesystem | Logs error, continues in-memory |
| EC-038 | SIGINT/SIGTERM handling | Process killed | Data saved before exit |

---

## 4. Mobile-Specific Test Cases

### 4.1 Touch Interaction

| ID | Test Case | Steps | Expected Result |
|----|-----------|-------|-----------------|
| MO-001 | Tap to select tab | Tap "Queue" tab on mobile | Tab switches, content updates |
| MO-002 | Scroll queue on mobile | Swipe up/down in queue list | Smooth scrolling, no lag |
| MO-003 | Tap reaction button | Tap emoji reaction | Visual feedback, emoji sent |
| MO-004 | Long press reaction | Long press emoji | No unexpected behavior |
| MO-005 | Pull to refresh (if implemented) | Pull down on queue | Queue refreshes |
| MO-006 | Tap YouTube search | Tap search button | Modal opens smoothly |
| MO-007 | Close modal swipe | Swipe down on modal | Modal closes (if gesture supported) |
| MO-008 | Form input focus | Tap input field | Virtual keyboard appears, no zoom |
| MO-009 | Form input blur | Tap outside input | Keyboard dismisses |
| MO-010 | Double-tap prevention | Double-tap submit button | Only one submission |

### 4.2 Viewport and Orientation

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| MO-011 | Portrait mode | Phone held vertically | UI fits screen, no horizontal scroll |
| MO-012 | Landscape mode | Phone rotated | UI adapts or locks to portrait |
| MO-013 | Small screen (320px) | Old iPhone SE | All elements visible and usable |
| MO-014 | Large phone (428px) | iPhone 14 Pro Max | UI scales appropriately |
| MO-015 | Tablet portrait | iPad in portrait | UI works, may show desktop-like layout |
| MO-016 | Tablet landscape | iPad in landscape | Works well with more space |
| MO-017 | Safe area insets | iPhone with notch | Content not hidden by notch/home indicator |
| MO-018 | Screen keyboard resize | Keyboard opens | Form stays visible, scrolls if needed |

### 4.3 Mobile Browser Specifics

| ID | Test Case | Browser | Expected Result |
|----|-----------|---------|-----------------|
| MO-019 | iOS Safari | iPhone Safari | Full functionality, no iOS bugs |
| MO-020 | Chrome Mobile Android | Android Chrome | Full functionality |
| MO-021 | Samsung Internet | Samsung browser | Full functionality |
| MO-022 | Firefox Mobile | Mobile Firefox | Full functionality |
| MO-023 | iOS Chrome | Chrome on iPhone | Works (uses WebKit) |
| MO-024 | In-app browser | Link from Instagram/Facebook | Works or prompts to open in browser |
| MO-025 | PWA mode (if applicable) | Add to home screen | App-like experience |

### 4.4 Mobile Performance

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| MO-026 | Initial load time | 3G connection | Page loads < 5 seconds |
| MO-027 | Socket reconnect on wake | Phone sleeps and wakes | WebSocket reconnects, state refreshes |
| MO-028 | Battery impact | App open for 1 hour | Reasonable battery usage |
| MO-029 | Memory usage | Extended use | No memory leaks, app stays responsive |
| MO-030 | Offline behavior | Lose network | Graceful error message |

### 4.5 Mobile Input

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| MO-031 | Autocomplete name | Browser suggests name | Works if configured |
| MO-032 | Paste YouTube URL | Long press, paste | URL pastes correctly |
| MO-033 | Copy from YouTube app | Share > Copy link | Can paste into form |
| MO-034 | Voice input | Use microphone for name | Works if browser supports |
| MO-035 | Emoji keyboard | Enter emoji in name | Works correctly |

---

## 5. Desktop-Specific Test Cases

### 5.1 Browser Compatibility

| ID | Test Case | Browser | Expected Result |
|----|-----------|---------|-----------------|
| DT-001 | Chrome latest | Chrome 120+ | Full functionality |
| DT-002 | Firefox latest | Firefox 120+ | Full functionality |
| DT-003 | Safari latest | Safari 17+ | Full functionality |
| DT-004 | Edge latest | Edge 120+ | Full functionality |
| DT-005 | Chrome older | Chrome 100 | Works or graceful degradation |
| DT-006 | Internet Explorer | IE 11 | Error message or redirect |

### 5.2 Screen Sizes

| ID | Test Case | Resolution | Expected Result |
|----|-----------|------------|-----------------|
| DT-007 | 4K display | 3840x2160 | Scales well, no tiny text |
| DT-008 | Standard desktop | 1920x1080 | Optimal layout |
| DT-009 | Laptop | 1366x768 | All content accessible |
| DT-010 | Small laptop | 1280x720 | Scrollable if needed |
| DT-011 | Ultrawide | 3440x1440 | Reasonable layout |

### 5.3 KJ Panel Desktop Features

| ID | Test Case | Feature | Expected Result |
|----|-----------|---------|-----------------|
| DT-012 | Keyboard shortcut - Space | Press Space while playing | Advances to next song |
| DT-013 | Keyboard shortcut - S | Press S while playing | Skip confirmation appears |
| DT-014 | Keyboard shortcut - P | Press P | Toggle pause |
| DT-015 | Shortcuts in input field | Type in input, press S | Does NOT trigger shortcut |
| DT-016 | Drag and drop queue | Mouse drag queue item | Item moves to new position |
| DT-017 | Drag and drop visual | While dragging | Dragging item shows opacity change |
| DT-018 | Multiple monitor setup | Display on projector, KJ on laptop | Both work independently |
| DT-019 | Right-click menu | Right-click queue item | Browser default or custom menu |
| DT-020 | Mouse hover states | Hover over buttons | Visual feedback (hover effects) |

### 5.4 Display Page Desktop Features

| ID | Test Case | Feature | Expected Result |
|----|-----------|---------|-----------------|
| DT-021 | Fullscreen toggle | Double-click display | Enters fullscreen mode |
| DT-022 | Exit fullscreen | Press Escape or double-click | Exits fullscreen |
| DT-023 | Cursor auto-hide | Don't move mouse for 3 seconds | Cursor disappears |
| DT-024 | Cursor reappear | Move mouse after hidden | Cursor reappears immediately |
| DT-025 | YouTube video controls | Click video controls | Play/pause/volume work |
| DT-026 | YouTube fullscreen in video | Click YouTube fullscreen | Video goes fullscreen within player |

### 5.5 Desktop Performance

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| DT-027 | Multiple tabs open | All 4 pages open | All function correctly |
| DT-028 | Extended runtime | Leave running for hours | No degradation |
| DT-029 | High reaction volume | Many users sending reactions | Display handles smoothly |
| DT-030 | Confetti performance | Multiple VIP performances | Confetti doesn't lag |

---

## 6. Real-time/WebSocket Test Cases

### 6.1 Connection Management

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| WS-001 | Initial connection | Load any page | Socket connects, receives initial state |
| WS-002 | Connection dropped | Disable network | Reconnection attempts begin |
| WS-003 | Connection restored | Re-enable network | Reconnects, state refreshes |
| WS-004 | Server restart | Restart server while connected | Clients reconnect after restart |
| WS-005 | Multiple clients connect | 10 clients join | All receive updates |

### 6.2 Event Broadcasting

| ID | Test Case | Event | Expected Result |
|----|-----------|-------|-----------------|
| WS-006 | queue-updated event | Song submitted | All clients receive queue update |
| WS-007 | now-playing event | KJ advances | All clients receive now-playing data |
| WS-008 | reaction event | Guest sends emoji | Display receives and shows emoji |
| WS-009 | pause-state event | KJ toggles pause | All clients receive pause state |
| WS-010 | vip-skip event | VIP uses skip | All clients receive notification |

### 6.3 Data Synchronization

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| WS-011 | Queue consistency | 3 clients view queue | All see identical queue order |
| WS-012 | Stats consistency | View stats on multiple pages | All stats match |
| WS-013 | Current song consistency | Check current on all views | Same performer shown everywhere |
| WS-014 | Rapid state changes | Quick succession of advances | All clients stay in sync |
| WS-015 | Offline then sync | Disconnect, changes happen, reconnect | State catches up correctly |

### 6.4 Edge Cases

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| WS-016 | Socket reconnect limit | Extended offline period | Eventually reconnects or shows error |
| WS-017 | Duplicate event handling | Same event received twice | No duplicate UI updates |
| WS-018 | Out-of-order events | Events arrive out of order | State still consistent |
| WS-019 | Large payload | 100+ songs in queue | Handles efficiently |
| WS-020 | CORS configuration | Cross-origin request | Allowed by server config |

---

## 7. Security/Validation Test Cases

### 7.1 Input Sanitization

| ID | Test Case | Attack Vector | Expected Result |
|----|-----------|---------------|-----------------|
| SE-001 | XSS in name | `<script>alert('XSS')</script>` | Script not executed, text escaped |
| SE-002 | XSS in song title | `<img onerror=alert(1) src=x>` | No script execution |
| SE-003 | XSS in YouTube URL | `javascript:alert(1)` | URL rejected as invalid |
| SE-004 | HTML injection | `<h1>Big Text</h1>` | HTML rendered as text |
| SE-005 | CSS injection | `<style>body{display:none}</style>` | No style injection |
| SE-006 | SQL-like injection | `'; DROP TABLE songs; --` | No effect (no SQL used) |

### 7.2 API Validation

| ID | Test Case | Endpoint | Expected Result |
|----|-----------|----------|-----------------|
| SE-007 | Missing deviceId | POST /api/guest/register without deviceId | 400 error |
| SE-008 | Missing name | POST /api/guest/register without name | 400 error |
| SE-009 | Unregistered guest submits song | POST /api/songs with unknown deviceId | 400 error |
| SE-010 | Invalid song ID for remove | POST /api/kj/remove/99999 | No error, no effect |
| SE-011 | Non-VIP uses VIP skip | POST /api/vip/skip with regular guest | 403 forbidden |
| SE-012 | VIP skip without song | POST /api/vip/skip with no songId | Error response |
| SE-013 | Invalid JSON body | POST with malformed JSON | 400 error |
| SE-014 | Empty request body | POST with no body | 400 error |
| SE-015 | Extra fields in request | Include unexpected fields | Ignored, no error |

### 7.3 Authorization

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| SE-016 | KJ endpoints without auth | Anyone can call /api/kj/* | Currently allowed (no auth) |
| SE-017 | Guest impersonation | Submit song with different deviceId | Works if deviceId registered |
| SE-018 | VIP status manipulation | Try to set isVip via API | Not possible (server-side check) |

### 7.4 Data Integrity

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| SE-019 | Concurrent song submissions | Race condition test | All songs saved, no data loss |
| SE-020 | Concurrent KJ actions | Two KJ clicks at once | Consistent state, no corruption |
| SE-021 | Large volume submissions | 1000 songs submitted | System handles load |
| SE-022 | Malicious songId | Try negative or float songId | Handled gracefully |

### 7.5 Resource Limits

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| SE-023 | Request flooding | 100 requests/second | Rate limiting or graceful handling |
| SE-024 | Reaction spam | 50 reactions/second | Display handles or rate limits |
| SE-025 | WebSocket flooding | Many socket messages | Server handles or rate limits |
| SE-026 | Memory exhaustion | Very large data in store | System degrades gracefully |

---

## 8. Integration Test Cases

### 8.1 Full User Flows

| ID | Test Case | Flow | Expected Result |
|----|-----------|------|-----------------|
| IT-001 | Guest full journey | Register -> Submit song -> View queue -> Get notified -> Perform | All steps work end-to-end |
| IT-002 | VIP full journey | Register as Kristin -> Submit -> Use skip -> Perform first | VIP features work throughout |
| IT-003 | KJ full party flow | Start -> Advance through 5 songs -> Pause -> Resume -> End | All controls work in sequence |
| IT-004 | Multi-user party | 5 users submit, KJ manages | Fair queue, real-time updates |
| IT-005 | Display full party | Watch display through entire party | All states shown correctly |

### 8.2 Cross-Page Integration

| ID | Test Case | Interaction | Expected Result |
|----|-----------|-------------|-----------------|
| IT-006 | Guest submit -> KJ sees | Submit on guest page | Appears in KJ queue |
| IT-007 | KJ advance -> Guest notified | KJ clicks advance | Guest gets toast |
| IT-008 | KJ advance -> Display updates | KJ advances | Display shows countdown |
| IT-009 | Guest reaction -> Display shows | Send reaction | Emoji floats on display |
| IT-010 | KJ pause -> All views pause | KJ pauses | Display overlay, guest knows |

### 8.3 Data Persistence Integration

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| IT-011 | Data survives restart | Submit songs, restart server | Songs still in queue |
| IT-012 | Guest persists across sessions | Register, close, reopen | Same guest identity |
| IT-013 | Stats persist | Complete songs, restart | Completed count accurate |
| IT-014 | VIP skip state persists | Use skip, restart | Skip still marked as used |

---

## 9. Accessibility Test Cases

| ID | Test Case | Requirement | Expected Result |
|----|-----------|-------------|-----------------|
| AC-001 | Screen reader - registration | Navigate form with screen reader | All fields announced |
| AC-002 | Screen reader - queue | Read queue items | Names and songs announced |
| AC-003 | Keyboard navigation - guest | Tab through guest page | All interactive elements reachable |
| AC-004 | Keyboard navigation - KJ | Tab through KJ panel | All buttons focusable and activatable |
| AC-005 | Color contrast | Check all text | Meets WCAG AA (4.5:1) |
| AC-006 | Focus indicators | Tab through page | Focus visible on all elements |
| AC-007 | Touch targets | Check button sizes | Minimum 44x44px on mobile |
| AC-008 | Reduced motion | prefers-reduced-motion | Animations reduced or disabled |
| AC-009 | Text scaling | Browser text zoom 200% | Layout remains usable |

---

## 10. Performance Test Cases

| ID | Test Case | Metric | Expected Result |
|----|-----------|--------|-----------------|
| PF-001 | Initial page load | Guest page Time to Interactive | < 3 seconds on 3G |
| PF-002 | Socket connection time | Time to receive initial state | < 500ms on broadband |
| PF-003 | Queue update latency | Time from submit to UI update | < 200ms |
| PF-004 | Reaction latency | Time from tap to display | < 300ms |
| PF-005 | Memory usage - display | RAM after 1 hour | < 200MB |
| PF-006 | CPU usage - display | CPU during confetti | < 50% |
| PF-007 | Concurrent users | 50 users connected | Server handles all |
| PF-008 | Large queue render | 100 songs in queue | UI remains responsive |

---

## 11. Error Handling Test Cases

| ID | Test Case | Error Scenario | Expected Result |
|----|-----------|----------------|-----------------|
| EH-001 | Network error on submit | Lose connection during submit | Error message shown, can retry |
| EH-002 | Server error response | Server returns 500 | User-friendly error message |
| EH-003 | YouTube API unavailable | YouTube iframe fails | Graceful error in player area |
| EH-004 | Invalid YouTube video | Video removed/private | Player shows error |
| EH-005 | WebSocket error | Socket connection fails | Retry mechanism, user notified |
| EH-006 | JSON parse error | Server sends malformed data | Error logged, UI doesn't crash |
| EH-007 | LocalStorage error | Storage quota exceeded | Error handled, session continues |
| EH-008 | File system error | Can't save JSON file | Logged, in-memory operation continues |

---

## 12. Roast/Intro Generation Test Cases

| ID | Test Case | Input | Expected Result |
|----|-----------|-------|-----------------|
| RO-001 | Generic roast | Regular guest, first song | Random generic roast generated |
| RO-002 | VIP roast | Guest named "Kristin" | VIP-specific roast selected |
| RO-003 | Returning singer roast | Guest has completed songs | Returning singer roast selected |
| RO-004 | Name substitution | Name "John", Song "Bohemian Rhapsody" | Name and song inserted in template |
| RO-005 | Roast variety | Same guest sings 5 times | Different roasts each time |

---

## 13. Drunk-O-Meter Test Cases

| ID | Test Case | Songs Completed | Expected Result |
|----|-----------|-----------------|-----------------|
| DO-001 | Initial state | 0 songs | 0%, "Sober Karaoke (Boring)" |
| DO-002 | Few songs | 4 songs | 20%, "Sober Karaoke (Boring)" |
| DO-003 | Moderate songs | 8 songs | 40%, "Liquid Courage Activated" |
| DO-004 | Many songs | 12 songs | 60%, "Peak Performance Zone" |
| DO-005 | Lots of songs | 16 songs | 80%, "No F*cks Given" |
| DO-006 | Maximum | 20+ songs | 100%, "LEGENDARY STATUS" |
| DO-007 | Cap at 100% | 50 songs | Stays at 100% |

---

## 14. Hall of Fame Test Cases

| ID | Test Case | Scenario | Expected Result |
|----|-----------|----------|-----------------|
| HF-001 | Initial state | No completed songs | Hall of fame empty |
| HF-002 | First completion | 1 song completed | Mic hog shows (1 song) |
| HF-003 | Mic hog determination | John: 3, Jane: 2 | John shown as mic hog |
| HF-004 | Tie for mic hog | John: 2, Jane: 2 | One shown (first found) |
| HF-005 | One-hit wonder count | 3 guests with 1 song each | "3 people" shown |
| HF-006 | No one-hit wonders | All guests have 2+ songs | Count shows 0 |

---

## 15. Countdown Timer Test Cases

| ID | Test Case | Time | Expected Result |
|----|-----------|------|-----------------|
| CD-001 | Initial countdown | 90 seconds | Normal styling |
| CD-002 | Warning threshold | 60 seconds | Warning styling |
| CD-003 | Urgent threshold | 30 seconds | Urgent styling (pulse) |
| CD-004 | Critical threshold | 10 seconds | Critical styling (shake) |
| CD-005 | Zero reached | 0 seconds | Transitions to now-playing |
| CD-006 | Pause during countdown | KJ pauses | Timer stops |
| CD-007 | Resume countdown | KJ resumes | Timer continues |
| CD-008 | Message updates | At various times | Messages change appropriately |

---

## Test Environment Setup

### Prerequisites
- Node.js 18+
- Modern browser (Chrome, Firefox, Safari, Edge)
- Multiple devices for cross-device testing
- Network tools for offline simulation

### Test Data
- Create multiple test guests
- Have various YouTube URLs ready (valid, invalid, private)
- Prepare names with "kristin" variations for VIP testing

### Test Tools Recommended
- Browser DevTools for network/console monitoring
- Mobile device simulators (Chrome DevTools, Safari Simulator)
- Network throttling tools
- Screen reader (NVDA, VoiceOver)
- Multiple browsers for compatibility testing
