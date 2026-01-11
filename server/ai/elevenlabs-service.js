/**
 * ElevenLabs Voice Synthesis Service for Birthday Karaoke DJ
 * Converts AI commentary text into spoken audio
 */

// Voice ID mappings for each persona
// These are ElevenLabs voice IDs - user will need to configure their own or use defaults
const VOICE_MAPPINGS = {
  'strip-club-dj': {
    voiceId: process.env.ELEVENLABS_VOICE_STRIP_CLUB || 'pNInz6obpgDQGcFmaJgB', // Adam - deep, energetic
    settings: {
      stability: 0.3,        // Lower = more expressive/variable
      similarity_boost: 0.75,
      style: 0.5,            // Moderate style exaggeration
      use_speaker_boost: true
    }
  },
  'snoop-dogg': {
    voiceId: process.env.ELEVENLABS_VOICE_SNOOP || 'ODq5zmih8GrVes37Dizd', // Patrick - laid back
    settings: {
      stability: 0.4,
      similarity_boost: 0.8,
      style: 0.3,            // More natural, less exaggerated
      use_speaker_boost: true
    }
  },
  'morgan-freeman': {
    voiceId: process.env.ELEVENLABS_VOICE_MORGAN || 'pqHfZKP75CvOlQylNhV4', // Bill - deep, narrator
    settings: {
      stability: 0.6,        // More stable for dramatic narration
      similarity_boost: 0.85,
      style: 0.4,
      use_speaker_boost: true
    }
  },
  'sports-announcer': {
    voiceId: process.env.ELEVENLABS_VOICE_SPORTS || 'ErXwobaYiN019PkySvjV', // Antoni - energetic
    settings: {
      stability: 0.25,       // Very expressive
      similarity_boost: 0.7,
      style: 0.6,            // High style for excitement
      use_speaker_boost: true
    }
  }
};

// Default model - turbo for faster generation
const DEFAULT_MODEL = 'eleven_turbo_v2_5';

// Cache for generated audio (in-memory, keyed by text hash)
const audioCache = new Map();
const CACHE_MAX_SIZE = 50;

/**
 * Check if ElevenLabs API is configured
 */
export function isConfigured() {
  return !!process.env.ELEVENLABS_API_KEY;
}

/**
 * Generate a simple hash for cache key
 */
function hashText(text, voicePersona) {
  let hash = 0;
  const str = `${voicePersona}:${text}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Synthesize text to speech
 * @param {string} text - The text to speak
 * @param {string} voicePersona - The voice persona to use
 * @returns {Promise<Buffer>} - Audio data as MP3 buffer
 */
export async function synthesize(text, voicePersona = 'strip-club-dj') {
  if (!isConfigured()) {
    throw new Error('ElevenLabs API not configured');
  }

  // Check cache first
  const cacheKey = hashText(text, voicePersona);
  if (audioCache.has(cacheKey)) {
    console.log('Using cached audio for:', text.substring(0, 50) + '...');
    return audioCache.get(cacheKey);
  }

  const voiceConfig = VOICE_MAPPINGS[voicePersona] || VOICE_MAPPINGS['strip-club-dj'];

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: DEFAULT_MODEL,
          voice_settings: voiceConfig.settings
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', response.status, error);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Cache the result
    if (audioCache.size >= CACHE_MAX_SIZE) {
      // Remove oldest entry
      const firstKey = audioCache.keys().next().value;
      audioCache.delete(firstKey);
    }
    audioCache.set(cacheKey, audioBuffer);

    console.log(`Generated ${audioBuffer.length} bytes of audio for: ${text.substring(0, 50)}...`);
    return audioBuffer;

  } catch (error) {
    console.error('Voice synthesis failed:', error);
    throw error;
  }
}

/**
 * Synthesize and return as base64 data URL
 * @param {string} text - The text to speak
 * @param {string} voicePersona - The voice persona to use
 * @returns {Promise<string>} - Base64 data URL for audio
 */
export async function synthesizeToDataUrl(text, voicePersona = 'strip-club-dj') {
  const audioBuffer = await synthesize(text, voicePersona);
  const base64 = audioBuffer.toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}

/**
 * Get available voices from ElevenLabs account
 * Useful for setting up voice IDs
 */
export async function listVoices() {
  if (!isConfigured()) {
    throw new Error('ElevenLabs API not configured');
  }

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list voices: ${response.status}`);
  }

  const data = await response.json();
  return data.voices.map(v => ({
    id: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels
  }));
}

/**
 * Get voice configuration for a persona
 */
export function getVoiceConfig(voicePersona) {
  return VOICE_MAPPINGS[voicePersona] || VOICE_MAPPINGS['strip-club-dj'];
}

/**
 * Clear the audio cache
 */
export function clearCache() {
  audioCache.clear();
}
