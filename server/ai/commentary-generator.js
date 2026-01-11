/**
 * Commentary Generator for Birthday Karaoke
 * Wraps Claude service with caching, fallbacks, and reaction aggregation
 */

import * as claudeService from './claude-service.js';

// Voice personas available to guests
export const VOICE_PERSONAS = {
  'strip-club-dj': {
    id: 'strip-club-dj',
    name: 'Strip Club DJ',
    description: 'Hypeman energy - "Coming to the staaaage..."',
    emoji: '🎤'
  },
  'snoop-dogg': {
    id: 'snoop-dogg',
    name: 'Snoop Dogg',
    description: 'Laid back vibes - "Fo shizzle..."',
    emoji: '🌿'
  },
  'morgan-freeman': {
    id: 'morgan-freeman',
    name: 'Morgan Freeman',
    description: 'Dramatic narrator - "In a world..."',
    emoji: '🎬'
  },
  'sports-announcer': {
    id: 'sports-announcer',
    name: 'Sports Announcer',
    description: 'High energy play-by-play',
    emoji: '🏈'
  }
};

// Default voice if none selected
export const DEFAULT_VOICE = 'strip-club-dj';

// Fallback intros when Claude is unavailable (grouped by context)
const FALLBACK_INTROS = {
  generic: [
    "Coming to the staaaage... {name} with '{song}'! This is gonna be GOOD!",
    "Put your hands together for {name}! They're about to absolutely CRUSH '{song}'!",
    "Give it up for the one, the only... {name}! Bringing you '{song}'!",
    "Ladies and gentlemen, {name} is ready to make some MAGIC with '{song}'!",
    "Here comes {name} with '{song}'! The crowd is already hyped!",
    "Making their way to the stage... {name}! Let's hear it for '{song}'!",
    "{name} is about to show us how it's DONE with '{song}'! Let's GO!",
    "You wanted a star? You GOT a star! {name} performing '{song}'!"
  ],
  vip: [
    "THE BIRTHDAY QUEEN TAKES THE STAGE! ALL HAIL {name}!",
    "Make way for ROYALTY! {name} is blessing us with '{song}'!",
    "The star of the night, THE reason we're all here... {name} with '{song}'!",
    "EVERYBODY ON YOUR FEET! The birthday legend {name} is performing '{song}'!",
    "This is HER moment! {name} absolutely OWNING '{song}'! LET'S GOOO!"
  ],
  returning: [
    "{name} is BACK for more! They're on FIRE tonight with '{song}'!",
    "The crowd favorite returns! {name} with another banger: '{song}'!",
    "{name} said 'one more won't hurt' and we are HERE for it! '{song}'!",
    "You can't keep a good singer down! {name} returns with '{song}'!"
  ]
};

// Reaction tracking for current song
let currentReactions = [];
const reactionWindow = 30000; // 30 second window for recent reactions

/**
 * Track a reaction for the current performance
 */
export function trackReaction(emoji, guestName) {
  currentReactions.push({
    emoji,
    guestName,
    timestamp: Date.now()
  });

  // Clean old reactions
  const cutoff = Date.now() - reactionWindow;
  currentReactions = currentReactions.filter(r => r.timestamp > cutoff);
}

/**
 * Get reaction summary for AI context
 */
export function getReactionSummary() {
  if (currentReactions.length === 0) return null;

  const emojiCounts = {};
  currentReactions.forEach(r => {
    emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
  });

  const sortedEmojis = Object.entries(emojiCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emoji, count]) => `${emoji} x${count}`)
    .join(', ');

  return `${currentReactions.length} reactions: ${sortedEmojis}`;
}

/**
 * Clear reactions for new song
 */
export function clearReactions() {
  currentReactions = [];
}

/**
 * Get fallback intro when Claude is unavailable
 */
function getFallbackIntro(guestName, songTitle, isVip, songsCompleted) {
  let pool;
  if (isVip) {
    pool = FALLBACK_INTROS.vip;
  } else if (songsCompleted > 0) {
    pool = FALLBACK_INTROS.returning;
  } else {
    pool = FALLBACK_INTROS.generic;
  }

  const template = pool[Math.floor(Math.random() * pool.length)];
  return template
    .replace(/{name}/g, guestName)
    .replace(/{song}/g, songTitle);
}

/**
 * Generate intro commentary for a performer
 */
export async function generateIntro(song, guest, stats) {
  const voicePersona = song.voicePersona || DEFAULT_VOICE;

  // If Claude not configured, use fallback
  if (!claudeService.isConfigured()) {
    console.log('Claude not configured, using fallback roast');
    return {
      text: getFallbackIntro(guest.name, song.songTitle, guest.isVip, guest.songsCompleted),
      voicePersona,
      source: 'fallback'
    };
  }

  try {
    const text = await claudeService.generateIntro({
      guestName: guest.name,
      songTitle: song.songTitle,
      voicePersona,
      songsCompleted: guest.songsCompleted || 0,
      isVip: guest.isVip || false,
      drunkOMeter: stats?.drunkOMeter || 0,
      recentReactions: getReactionSummary()
    });

    return {
      text,
      voicePersona,
      source: 'claude'
    };
  } catch (error) {
    console.error('Commentary generation failed:', error);
    return {
      text: getFallbackIntro(guest.name, song.songTitle, guest.isVip, guest.songsCompleted),
      voicePersona,
      source: 'fallback'
    };
  }
}

/**
 * Generate post-song commentary
 */
export async function generatePostSong(song, guest, durationSeconds) {
  const voicePersona = song.voicePersona || DEFAULT_VOICE;

  if (!claudeService.isConfigured()) {
    const mins = Math.floor(durationSeconds / 60);
    return {
      text: `That was ${guest.name} with "${song.songTitle}"! ${mins > 5 ? 'What a marathon!' : 'Solid effort!'}`,
      voicePersona,
      source: 'fallback'
    };
  }

  try {
    const text = await claudeService.generatePostSong({
      guestName: guest.name,
      songTitle: song.songTitle,
      voicePersona,
      durationSeconds,
      reactionSummary: getReactionSummary(),
      songsCompleted: guest.songsCompleted || 0
    });

    return {
      text,
      voicePersona,
      source: 'claude'
    };
  } catch (error) {
    console.error('Post-song generation failed:', error);
    return {
      text: `That was ${guest.name}! Give it up!`,
      voicePersona,
      source: 'fallback'
    };
  }
}

/**
 * Generate milestone announcement
 */
export async function generateMilestone(milestone, voicePersona, partyStats) {
  if (!claudeService.isConfigured()) {
    return {
      text: milestone,
      voicePersona: voicePersona || DEFAULT_VOICE,
      source: 'fallback'
    };
  }

  try {
    const text = await claudeService.generateMilestone({
      milestone,
      voicePersona: voicePersona || DEFAULT_VOICE,
      partyStats
    });

    return {
      text,
      voicePersona: voicePersona || DEFAULT_VOICE,
      source: 'claude'
    };
  } catch (error) {
    return {
      text: milestone,
      voicePersona: voicePersona || DEFAULT_VOICE,
      source: 'fallback'
    };
  }
}

/**
 * Get available voice personas for UI
 */
export function getVoicePersonas() {
  return Object.values(VOICE_PERSONAS);
}

/**
 * Validate voice persona
 */
export function isValidPersona(personaId) {
  return personaId in VOICE_PERSONAS;
}
