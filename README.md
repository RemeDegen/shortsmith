# shortsmith

Turn the *ideas* in a long-form video into original short-form videos — locally,
with Claude Code driving the pipeline.

You hand it a video link. It pulls the transcript, extracts atomic ideas, writes a
script, narrates it, generates background plates on your own machine, and renders a
1080×1920 short with word-accurate captions.

**It does not touch the source video's footage or audio.** Only ideas travel, and
ideas are not copyrightable. What ships is your script, your voice track, your
visuals.

---

## Why this exists

Most "AI short-form" tooling produces the exact pattern platforms now demonetise:
stock clips stitched under a synthetic voice, fifty videos from one template.
YouTube's July 2026 inauthentic-content policy names it directly — *"image slideshows
and templated storylines"*, *"unrelated or incoherent AI clips edited together"* —
and it is assessed at the **channel** level, not per video.

shortsmith is built around avoiding that:

- **Motion is code, not generated video.** Plates are still images; Ken Burns,
  parallax, grain and vignette are computed per frame in Remotion.
- **Every visual is derived from a specific sentence** in your script, not pulled
  from a stock pool. See [docs/visual-method.md](docs/visual-method.md).
- **Two human gates** are built into the workflow — idea selection and script
  approval. Fully unattended generation is the thing that gets punished.

---

## What runs where

| Stage | Where | Cost |
|---|---|---|
| Transcript | local | free |
| Idea extraction, script | Claude Code | your plan |
| Narration | ElevenLabs API | from $5/mo |
| Background plates | **local** — FLUX.2 klein, Apache 2.0 | free |
| Word timing | comes with the narration call | free |
| Render | **local** — Remotion | free |

The only cloud dependency is text-to-speech. Everything visual runs on your machine.

---

## Requirements

- **Apple Silicon Mac.** Image generation and the whisper fallback are built on MLX.
- **16 GB RAM minimum** — plate generation peaks at ~12 GB.
- **~6.5 GB disk** for models.
- Homebrew, Node, Python 3.12+, an ElevenLabs account (paid tier required for
  commercial use and for API access to library voices).

---

## Quick start

```bash
git clone https://github.com/RemeDegen/shortsmith.git
cd shortsmith

# 1. Install everything (see SETUP.md for the detail)
brew install ffmpeg node uv
cd video && npm install && cd ..
uv tool install --python 3.12 mflux

# 2. Download the image model into the project (~4.3 GB)
HF_HOME="$PWD/models/flux2-klein-4b" \
  ~/.local/share/uv/tools/mflux/bin/python -c \
  "from huggingface_hub import snapshot_download; \
   snapshot_download('Runpod/FLUX.2-klein-4B-mflux-4bit', max_workers=4)"

# 3. Configure
cp .env.example .env      # then add your ElevenLabs key and voice id
python3 tools/tts.py check

# 4. Open Claude Code in this directory and say:
#    "make a short from https://youtube.com/watch?v=..."
```

Claude reads `.claude/skills/make-short/SKILL.md` and works through the stages.
Full install notes, measured timings and the errors you are likely to hit:
**[SETUP.md](SETUP.md)**.

---

## Project status

Built and used for a real channel, but be aware of what is and isn't proven:

| Stage | State |
|---|---|
| Transcript, idea extraction, script | Working |
| Plate generation (`plate.sh`) | Working — timings in this README are measured |
| Scene plan (`make_plan.py`) | Working, including `scaffold` |
| Render (Remotion) | Working — 1080×1920 H.264 + AAC |
| **Narration (`tts.py say`)** | **Unverified.** The code path has never completed successfully; every attempt so far hit `402` on a free ElevenLabs tier. The fallback (whisper + `align.py`) is confirmed working. |

If you run `tts.py say` successfully on a paid plan, an issue confirming it would be
genuinely useful.

---

## The pipeline

```
1. Transcript
2. Idea extraction ──────────── GATE 1  (you pick the idea)
3. Script ─────────────────── GATE 2  (you approve / add your own take)
        │
        ├─→ 4. Plates      (background, ~9 min)  ┐ in parallel
        └─→ 5. Narration   (seconds)             ┘
        │
6. Scene plan   (plates and word timings both ready)
7. Render + frame check
8. Publish
```

Each stage reads a file and writes a file, so the work is inspectable and
resumable. `STATUS.md` records where you left off.

---

## Layout

```
sources/<source-slug>/      summary.md · transcript.txt · ideas.md
scripts/<short-slug>.md     script, hook variants, delivery notes
plans/<short-slug>.base.json     structure   (scaffolded from the script)
      <short-slug>.json          timed plan  (generated)
audio/<short-slug>.mp3 · .words.json
visuals/plates/<short-slug>-<scene>.png    scene-specific, script-derived
visuals/plates/library/                    general-purpose fallback plates
video/                      Remotion project
out/<short-slug>.mp4
tools/                      tts.py · align.py · make_plan.py · plate.sh
docs/                       visual method, platform policies
```

One source video yields several shorts, so source-level and short-level names live
in separate namespaces. The rule is in the skill file.

---

## Tools

| Command | What it does |
|---|---|
| `tools/tts.py check` | Verify ElevenLabs setup without spending credits |
| `tools/tts.py say <slug>` | Narration + word timestamps in one call |
| `tools/align.py <slug> <whisper.json>` | Fallback: whisper timings, script spelling |
| `tools/make_plan.py scaffold <slug>` | Build the scene plan skeleton from the script |
| `tools/make_plan.py plan <slug> <mp3>` | Produce the timed plan |
| `STYLE=real tools/plate.sh <name> "<prompt>"` | Generate a background plate |

---

## Licensing of what it produces

- **FLUX.2 klein-4B** — Apache 2.0. Commercial use is unrestricted.
- **ElevenLabs** — the free tier forbids commercial use, requires attribution, and
  blocks library voices over the API. A paid plan is required to publish.
- **Your output** — yours. Credit the source of the idea in your description.

Platform AI-disclosure rules and what actually triggers them:
[docs/platform-policies.md](docs/platform-policies.md).

---

## Language

The pipeline is language-agnostic; set `lang` in the plan and pick a matching
ElevenLabs voice. It was built for Turkish shorts about AI engineering, so the
script-writing guidance in the skill file reflects that use case — adjust it for
yours.

---

## License

MIT — see [LICENSE](LICENSE).
