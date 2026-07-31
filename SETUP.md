# Setup

Every command below was actually run on the reference machine (M4 MacBook Air,
16 GB, macOS 25.5). Nothing here is guessed.

**Total:** ~6.5 GB of downloads · 30-60 minutes, mostly waiting · Apple Silicon required.

> ⚠️ **Turn off your VPN.** Model downloads ran 40× slower through one
> (99 KB/s vs 3.9 MB/s). That was measured, not assumed.

---

## 1. Base tools

```bash
brew install ffmpeg node uv
```

- **ffmpeg** — audio duration (`ffprobe`), frame extraction. Tested with 8.1.2.
- **node** — for Remotion. Tested with v24.14.0.
- **uv** — Python tool installer. Tested with 0.11.18.

```bash
ffprobe -version | head -1 && node -v && uv --version
```

---

## 2. Remotion dependencies

```bash
cd video && npm install && cd ..
```

Remotion 4.x with React 19. First install takes a few minutes.

Check it works:
```bash
cd video && npx remotion studio
```
The bundled example plan should open in your browser. `Ctrl-C` to stop.

---

## 3. Image generation — mflux + FLUX.2 klein

### 3a. mflux
```bash
uv tool install --python 3.12 mflux
```

The Python 3.12 pin is deliberate — MLX dependencies don't resolve on 3.14.

### 3b. The model (4.3 GB, into the project)
```bash
HF_HOME="$PWD/models/flux2-klein-4b" \
  ~/.local/share/uv/tools/mflux/bin/python -c \
  "from huggingface_hub import snapshot_download; \
   snapshot_download('Runpod/FLUX.2-klein-4B-mflux-4bit', max_workers=4)"
```

**`HF_HOME` points into the project** so the model lands in `models/` rather than
your home directory. `tools/plate.sh` uses the same path.

About the model: FLUX.2 klein-4B, 4-bit quantised, **Apache 2.0**. Uploaded by a
verified HuggingFace organisation (RunPod); the source model is Black Forest Labs'
official repository. All weights are `.safetensors` — a data-only format that cannot
execute code, and the repo contains no Python.

### 3c. Integrity check — DON'T SKIP
```bash
S=$(find models/flux2-klein-4b/hub/models--Runpod--FLUX.2-klein-4B-mflux-4bit/snapshots \
    -maxdepth 1 -mindepth 1 -type d | head -1)
for f in transformer/0.safetensors transformer/1.safetensors \
         text_encoder/0.safetensors text_encoder/1.safetensors vae/0.safetensors; do
  [ -e "$S/$f" ] && echo "  ok      $f" || echo "  MISSING $f"
done
find models -name "*.incomplete" -delete
```

**A partially downloaded model produces pure noise**, and you only find out when you
open the image. `tools/plate.sh` now runs this check itself before generating, but
verify once by hand during setup.

### 3d. Test
```bash
STYLE=real tools/plate.sh test "a bare NVMe drive on a wooden desk, warm lamp light" 1
```
`visuals/plates/test.png` should appear. ~1.7 min, ~12 GB peak memory.

---

## 4. Narration — ElevenLabs

### 4a. Plan
**A paid plan is required.** On the free tier:
- Commercial use is prohibited and attribution is mandatory
- Library voices **cannot be used over the API** (`402 Payment Required`)

The cheapest sufficient plan is **Starter, $5/month**, which includes a full
commercial licence.

### 4b. API key
https://elevenlabs.io/app/settings/api-keys → **Create API Key**

The key is shown **once**. Enable these permissions:
- Text to Speech
- **Voices → Read** (needed to list voices)
- Models → Read
- User → Read

### 4c. Configure
```bash
cp .env.example .env
chmod 600 .env
```
Then fill in `ELEVENLABS_API_KEY` and `ELEVEN_VOICE_ID`.

Find a voice:
```bash
python3 tools/tts.py voices
```

Pick one and keep it. The voice is your channel's identity; changing it mid-run makes
the archive sound inconsistent.

### 4d. Verify
```bash
python3 tools/tts.py check
```

Prints the plan tier and settings without spending credits. If it says `free`,
narration will fail with a 402 — listing voices working is **not** proof that
generation will.

---

## 5. Whisper — optional fallback (1.5 GB)

Only needed if you produce audio by hand instead of through the API. With the API,
word timings come back from the same call.

```bash
uv tool install mlx-whisper

HF_HOME="$PWD/models/whisper-large-v3-turbo" mlx_whisper <audio.mp3> \
  --model mlx-community/whisper-large-v3-turbo --language en \
  --word-timestamps True --output-format json --output-dir /tmp/whisper-out
```

The model downloads on first run. It is kept in a **separate directory from FLUX** so
the two caches never mix.

---

## 6. Transcripts

Stage 1 needs a transcript of the source video. Any of these works:

- A transcript-fetching skill in Claude Code
- `yt-dlp --write-auto-sub --skip-download <url>`
- whisper on the downloaded audio
- Pasting it in by hand

Store the result at `sources/<source-slug>/transcript.txt`.

---

## Post-install check

```bash
test -f .env && grep -q "ELEVENLABS_API_KEY=sk" .env && echo "env ok"
ls models/flux2-klein-4b/hub/models--Runpod--FLUX.2-klein-4B-mflux-4bit >/dev/null 2>&1 && echo "flux ok"
test -d video/node_modules && echo "remotion ok"
which ffprobe node uv >/dev/null && echo "tools ok"
python3 tools/tts.py check
```

All green means the pipeline is ready. Open Claude Code in this directory and give it
a video link — it follows `.claude/skills/make-short/SKILL.md`.

---

## Disk and hardware

| Item | Size |
|---|---|
| FLUX.2 klein-4B | 4.3 GB |
| Whisper large-v3-turbo (optional) | 1.5 GB |
| node_modules | ~500 MB |
| **Total** | **~6.5 GB** |

**Apple Silicon is required** — mflux and mlx-whisper are built on MLX and will not
run on Intel Macs or Linux.

**16 GB RAM is the floor.** Plate generation peaks at 12.2 GB at 768×1344. Higher
resolutions swap: 1088×1920 peaks at 20.2 GB and is unusable.

---

## Problems actually encountered

| Symptom | Cause | Fix |
|---|---|---|
| Download crawling at ~100 KB/s | VPN active | Turn it off — 40× difference measured |
| Generated plate is pure noise | Model partially downloaded | Run the check in 3c |
| `402 Payment Required` | Free tier | Upgrade to Starter ($5/mo) |
| `missing permission voices_read` | API key scoped too narrowly | Widen the key's permissions |
| mflux install fails on dependencies | Python 3.14 | Install with `--python 3.12` |
| `tts.py check` says ok but generation 402s | You checked `voices` instead of the tier | Use `tts.py check`, not `voices` |
