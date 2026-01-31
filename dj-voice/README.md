# Peppermint Hippo DJ Voice Generator 🎙️

AI-powered strip club DJ voice for karaoke intros - inspired by South Park's Peppermint Hippo.

## Files

- `kristin-birthday-intro.mp3` - Pre-generated intro for Kristin's birthday (17.4s)
- `generate-dj-intro.sh` - Script to generate custom intros for any name

## Usage

### Pre-generated Kristin Intro
```bash
# Just play it!
afplay dj-voice/kristin-birthday-intro.mp3
```

### Generate Custom Intro
```bash
# Requires ELEVENLABS_API_KEY in environment
./dj-voice/generate-dj-intro.sh "Mike" "mike-intro.mp3"
./dj-voice/generate-dj-intro.sh "Brandon" "brandon-intro.mp3"
```

## How It Works

The script uses a 3-step pipeline:

1. **Generate text** with a neutral ElevenLabs voice (Adam)
2. **Speech-to-Speech** conversion using our Peppermint Hippo DJ voice clone
3. **Add reverb/PA effect** to simulate the strip club sound system

The Speech-to-Speech step is key - it captures the sleazy, cartoonish delivery style from the original South Park audio.

## Voice Settings

- **Voice ID:** `YL7r8z98wi0mykBGKuBD` (Peppermint Hippo DJ v4)
- **Stability:** 0.7 (smooth, not chaotic)
- **Similarity Boost:** 0.85 (strong voice match)

## Requirements

- `ELEVENLABS_API_KEY` environment variable
- `ffmpeg` for audio processing
- `curl` for API calls

## The Intro Text

The default intro says:
> "Oh yeahhh... do not forget to tip your waitresses fellas... and coming to the main stage right now... she is beautiful... she is talented... she is the birthday girl... everybody put your hands together and welcome to the stage... [NAME]..."

Edit `generate-dj-intro.sh` to customize the patter.
