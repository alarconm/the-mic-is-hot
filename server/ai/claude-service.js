/**
 * Claude AI Service for Birthday Karaoke DJ
 * Generates personalized, spicy commentary for performers
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize client (uses ANTHROPIC_API_KEY env var automatically)
let anthropic = null;

function getClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

// Voice persona prompts - each creates a distinct DJ personality
export const PERSONA_PROMPTS = {
  'strip-club-dj': `You are an over-the-top strip club DJ/hypeman announcer. Your style:
- Start with "Coming to the staaaage..." or "Make some NOISE for..."
- Draw out words dramatically ("Laaaadies and gentlemennnnn")
- Maximum hype energy, like you're announcing a headliner
- Use phrases like "Give it up for...", "Put your hands together...", "The one, the only..."
- Add reverb-style emphasis (repeat last word like "...the STAGE stage stage...")`,

  'snoop-dogg': `You are speaking like Snoop Dogg - laid back, fun, and cool. Your style:
- Use "fo shizzle", "izzle" suffixes naturally
- Relaxed, drawn-out delivery
- Phrases like "What's good y'all", "That's what's up", "Nah for real though"
- Reference the vibe, keeping it chill
- Occasional "nephew/niece" when addressing performers`,

  'morgan-freeman': `You are Morgan Freeman narrating an epic, dramatic moment. Your style:
- Speak as if narrating a documentary about human triumph
- Use profound, philosophical observations
- Dramatic pauses indicated by "..."
- Make even mundane things sound deeply meaningful
- Phrases like "And so it was...", "In this moment...", "They say..."`,

  'sports-announcer': `You are an excited sports announcer doing play-by-play. Your style:
- HIGH ENERGY, like calling a championship game
- Use sports metaphors ("stepping up to the plate", "going for the gold")
- Quick, punchy sentences
- "AND THE CROWD GOES WILD" energy
- Stats and comparisons ("Their 3rd attempt tonight!")`
};

// Base system prompt for all personas
const BASE_SYSTEM = `You are the AI DJ for a birthday karaoke party. Your job is to introduce performers with DELIGHTFUL party humor - puns, wordplay, adult-friendly jokes, and real-time awareness of what's happening.

VIBE: Fun, clever, surprisingly aware, making everyone laugh and feel hyped. You're the cool DJ who notices everything and has the perfect quip. Adult party humor is welcome - be cheeky but never crude.

CONTEXT YOU'LL RECEIVE:
- Performer's name
- Song they're singing
- How many songs they've sung tonight (songsCompleted)
- Whether they're the VIP/birthday person
- Time into the party (drunk-o-meter level)
- Any recent crowd reactions

RULES:
1. Keep it SHORT - 2-4 sentences max for intros
2. Be CLEVER about the song - puns on lyrics, artist references, genre jokes
3. If they've sung multiple songs, make a fun observation ("They're on a ROLL!")
4. VIP (birthday person) gets MAXIMUM celebration - it's HER night!
5. Late night (high drunk-o-meter) = even more playful and silly
6. Reference crowd reactions if you have them ("The crowd is ALREADY loving this!")
7. Make people feel like a STAR about to crush it
8. Puns are ALWAYS welcome. The more groan-worthy, the better.

NEVER be mean or cutting - lift people UP while being hilarious.

OUTPUT: Just the announcement text, nothing else. No quotes, no "DJ says:", just the words to speak.`;

/**
 * Generate performer introduction
 */
export async function generateIntro({ guestName, songTitle, voicePersona, songsCompleted, isVip, drunkOMeter, recentReactions }) {
  const client = getClient();
  if (!client) {
    throw new Error('Claude API not configured');
  }

  const personaPrompt = PERSONA_PROMPTS[voicePersona] || PERSONA_PROMPTS['strip-club-dj'];

  const userPrompt = `Generate an introduction for this performer:

PERFORMER: ${guestName}
SONG: "${songTitle}"
SONGS SUNG TONIGHT: ${songsCompleted} (this will be #${songsCompleted + 1})
IS VIP/BIRTHDAY PERSON: ${isVip ? 'YES - give them extra love!' : 'No'}
DRUNK-O-METER: ${drunkOMeter}% (0=sober start, 100=legendary party mode)
${recentReactions ? `RECENT CROWD VIBE: ${recentReactions}` : ''}

Remember: ${isVip ? 'This is the BIRTHDAY QUEEN - maximum hype!' : songsCompleted > 0 ? `They've already sung ${songsCompleted} songs - acknowledge their dedication!` : 'First timer - give them encouragement with a side of playful doubt!'}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    system: `${BASE_SYSTEM}\n\n${personaPrompt}`,
    messages: [{ role: 'user', content: userPrompt }]
  });

  return response.content[0].text.trim();
}

/**
 * Generate post-song commentary
 */
export async function generatePostSong({ guestName, songTitle, voicePersona, durationSeconds, reactionSummary, songsCompleted }) {
  const client = getClient();
  if (!client) {
    throw new Error('Claude API not configured');
  }

  const personaPrompt = PERSONA_PROMPTS[voicePersona] || PERSONA_PROMPTS['strip-club-dj'];

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const durationText = `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;

  const userPrompt = `Generate a SHORT post-performance comment (1-2 sentences max):

PERFORMER: ${guestName}
SONG: "${songTitle}"
PERFORMANCE DURATION: ${durationText}
${reactionSummary ? `CROWD REACTIONS: ${reactionSummary}` : 'CROWD REACTIONS: Mild applause'}
TOTAL SONGS BY THIS PERSON: ${songsCompleted + 1}

Make a quick, punchy comment about the performance. Reference the duration if it's notably long (>5 min) or short (<2 min). Mention crowd reactions if notable.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    system: `${BASE_SYSTEM}\n\n${personaPrompt}`,
    messages: [{ role: 'user', content: userPrompt }]
  });

  return response.content[0].text.trim();
}

/**
 * Generate milestone announcement
 */
export async function generateMilestone({ milestone, voicePersona, partyStats }) {
  const client = getClient();
  if (!client) {
    throw new Error('Claude API not configured');
  }

  const personaPrompt = PERSONA_PROMPTS[voicePersona] || PERSONA_PROMPTS['strip-club-dj'];

  const userPrompt = `Generate a SHORT party milestone announcement (1 sentence):

MILESTONE: ${milestone}
PARTY STATS: ${JSON.stringify(partyStats)}

Examples of milestones: "10 songs completed", "Party has been going for 2 hours", "Someone just sang their 5th song"`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 75,
    system: `${BASE_SYSTEM}\n\n${personaPrompt}`,
    messages: [{ role: 'user', content: userPrompt }]
  });

  return response.content[0].text.trim();
}

/**
 * Check if Claude API is configured
 */
export function isConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}
