#!/usr/bin/env bash
# Generates a background plate with FLUX.2 klein (local, Apache 2.0).
#
# The model and its cache live INSIDE the project (models/), never in ~/.cache.
#
# Usage:
#   tools/plate.sh <output-name> "<prompt>" [seed] [width] [height]
#   STYLE=real tools/plate.sh hero "a bare NVMe drive on a wooden desk" 42
#
# Styles:
#   STYLE=real      photorealistic real-world tech scene (scene's main visual)
#   STYLE=abstract  abstract texture (sits behind text at low opacity)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Each model gets its own directory so image generation and speech models
# never share a cache.
export HF_HOME="$ROOT/models/flux2-klein-4b"
export PATH="$HOME/.local/bin:$PATH"

MODEL="Runpod/FLUX.2-klein-4B-mflux-4bit"   # FLUX.2 klein-4B, 4-bit, Apache 2.0
BASE="flux2-klein-4b"

NAME="${1:?output name required}"
PROMPT="${2:?prompt required}"
SEED="${3:-42}"
# Measured on an M4 MacBook Air (16 GB): 1088x1920 peaks at 20.2 GB and swaps.
# Plates sit behind a vignette anyway, so this resolution is plenty.
WIDTH="${4:-768}"
HEIGHT="${5:-1344}"

# --- Model integrity check ------------------------------------------------
# Generating with a partially downloaded model produces pure noise, and you
# only notice when you open the image. Verify BEFORE spending two minutes.
SNAP=$(find "$HF_HOME/hub/models--Runpod--FLUX.2-klein-4B-mflux-4bit/snapshots" \
       -maxdepth 1 -mindepth 1 -type d 2>/dev/null | head -1 || true)
if [ -z "$SNAP" ]; then
  echo "ERROR: model not downloaded yet. See SETUP.md section 3." >&2; exit 1
fi
for f in transformer/0.safetensors transformer/1.safetensors \
         text_encoder/0.safetensors text_encoder/1.safetensors vae/0.safetensors; do
  if [ ! -e "$SNAP/$f" ]; then
    echo "ERROR: model incomplete — $f missing. Finish the download:" >&2
    echo "  HF_HOME=$HF_HOME python -c \"from huggingface_hub import snapshot_download; snapshot_download('$MODEL')\"" >&2
    exit 1
  fi
done

# Shared suffix — this is the channel's visual identity. See docs/visual-method.md
#
# In "real" mode out-of-focus text is DELIBERATE. Diffusion models cannot render
# legible text; shallow depth of field turns that flaw into realism.
case "${STYLE:-abstract}" in
  real)
    SUFFIX="photorealistic, shot on 35mm, shallow depth of field, dark room lit by screen glow, warm orange and amber accents against deep blue-black shadows, cinematic color grading, fine film grain, bokeh, no people, no faces, no readable text, out-of-focus code, vertical composition"
    ;;
  *)
    SUFFIX="deep charcoal black base, burnt orange accents only, duotone, fine film grain, soft depth of field, no text, no letters, no people, no faces, no logos, cinematic volumetric lighting, vertical composition"
    ;;
esac

mkdir -p "$ROOT/visuals/plates"
time mflux-generate-flux2 \
  --model "$MODEL" --base-model "$BASE" \
  --low-ram --steps 6 --seed "$SEED" \
  --width "$WIDTH" --height "$HEIGHT" \
  --metadata \
  --prompt "$PROMPT, $SUFFIX" \
  --output "$ROOT/visuals/plates/$NAME.png"
