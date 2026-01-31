#!/bin/bash
# Peppermint Hippo DJ Voice Generator
# Usage: ./generate-dj-intro.sh "Name" "output.mp3"
#
# Uses the winning pipeline:
# 1. Generate text with neutral voice (Adam)
# 2. Run through Speech-to-Speech with Peppermint Hippo DJ clone
# 3. Add reverb/PA effect

set -e
source ~/.clawdbot/.env

NAME="${1:-Kristin}"
OUTPUT="${2:-dj-intro.mp3}"
TEMP_DIR=$(mktemp -d)

# Phonetic name (add hyphen before last syllable for correct pronunciation)
PHONETIC_NAME="$NAME"

echo "🎙️ Generating Peppermint Hippo DJ intro for: $NAME"

# The intro text
TEXT="Oh yeahhh... do not forget to tip your waitresses fellas... and coming to the main stage right now... she is beautiful... she is talented... she is the birthday girl... everybody put your hands together and welcome to the stage... ${PHONETIC_NAME}..."

# Step 1: Generate with neutral voice (Adam)
echo "Step 1: Generating neutral voice..."
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$TEXT\",
    \"model_id\": \"eleven_multilingual_v2\",
    \"voice_settings\": {
      \"stability\": 0.6,
      \"similarity_boost\": 0.75,
      \"style\": 0.3
    }
  }" \
  --output "$TEMP_DIR/neutral.mp3"

# Step 2: Speech-to-Speech with DJ voice
echo "Step 2: Applying Peppermint Hippo DJ style..."
curl -s -X POST "https://api.elevenlabs.io/v1/speech-to-speech/YL7r8z98wi0mykBGKuBD" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -F "audio=@$TEMP_DIR/neutral.mp3" \
  -F "model_id=eleven_english_sts_v2" \
  -F "voice_settings={\"stability\":0.7,\"similarity_boost\":0.85}" \
  --output "$TEMP_DIR/sts.mp3"

# Step 3: Add reverb/PA effect
echo "Step 3: Adding strip club reverb..."
ffmpeg -i "$TEMP_DIR/sts.mp3" \
  -af "aecho=0.8:0.9:60|80:0.4|0.3,highpass=f=80,lowpass=f=6000,compand=attacks=0.2:decays=0.6:points=-80/-80|-45/-45|-27/-12|0/-3:gain=5" \
  "$OUTPUT" -y 2>/dev/null

# Cleanup
rm -rf "$TEMP_DIR"

# Get duration
DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT" 2>/dev/null)
echo "✅ Done! Saved to: $OUTPUT (${DUR}s)"
