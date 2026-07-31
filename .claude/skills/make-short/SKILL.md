---
name: make-short
description: Turns a long-form video into an original short — transcript, idea extraction, script, ElevenLabs narration, local FLUX plate generation, Remotion render. Use when the user gives a video link and asks for a short.
---

# Short production pipeline

The user hands you a source video; you produce a short end to end.
This file is the single source of truth — stage order, commands, decisions.

**Read first:** `STATUS.md` (where things were left), `README.md` (what this is),
`docs/visual-method.md` (how plates are chosen).

---

## Flow

```
1. Transcript
2. Idea extraction ──────────── GATE 1  (user picks the idea)
3. Script ─────────────────── GATE 2  (user approves / adds their own take)
        │
        ├─→ 4. Plates      (background, ~9 min)  ┐ PARALLEL
        └─→ 5. Narration   (seconds)             ┘
        │
6. Scene plan   (plates and word timings both ready)
7. Render + frame check
8. Publish
```

**Kick off plate generation at stage 4 in the background and move on.** The moment
the script is approved the plates' subjects are known — they have no reason to wait
for the scene plan. Narration and planning happen while FLUX runs. Saves ~9 minutes.

---

## Where things were left

**Update `STATUS.md` after every stage.** Sessions end; the answer to "where were we"
lives in that file, not in chat history. Check it before starting anything new.

---

## Division of labour

| Deterministic → SCRIPT | Judgement → YOU |
|---|---|
| Fetching transcripts | Idea extraction |
| Narration + word timings | Script and hook variants |
| Timing arithmetic | Scene plan, which component goes where |
| Plate generation | Plate prompts |
| Rendering | Quality control |

**Never hand-roll ffmpeg arithmetic, timing or file paths.** The scripts exist and
they produce the same result every time.

---

## TWO MANDATORY GATES

This pipeline is deliberately not fully automatic. YouTube's July 2026
inauthentic-content policy demonetises *"mass-produced AI content that doesn't add
the creator's own insight or perspective"* and assesses it at the **channel** level.
Detail: `docs/platform-policies.md`.

- **Gate 1 — Idea selection.** Produce 4-6 candidates. The user picks. You don't.
- **Gate 2 — Script approval.** Write it, then let the user approve or add their
  own example, case or opinion.

Outside these two points, keep moving.

---

## Stage 0 — Setup check

Verify on first run, then skip:

```bash
test -f .env && grep -q "ELEVENLABS_API_KEY=sk" .env && echo "env ok"
ls models/flux2-klein-4b/hub/models--Runpod--FLUX.2-klein-4B-mflux-4bit >/dev/null 2>&1 && echo "flux ok"
test -d video/node_modules && echo "remotion ok"
which ffprobe node uv >/dev/null && echo "tools ok"
python3 tools/tts.py check   # prints the plan tier — "free" means narration WILL FAIL
```

**If anything is missing, open `SETUP.md` and follow that section.** It has the real
commands, download sizes and the errors people actually hit. Don't improvise.

---

## Stage 1 — Transcript

Fetch the transcript however you can — a transcript skill, a local whisper run, or
the user pasting it in. Then store it:

- `sources/<source-slug>/summary.md`
- `sources/<source-slug>/transcript.txt`

If the video has no captions, whisper transcription takes minutes — give it a
**600000 ms timeout**.

Naming rules: see **Naming — TWO SEPARATE SLUGS** below.

---

## Stage 2 — Idea extraction → GATE 1

Pull **4-6 atomic ideas** from the transcript. Criteria: summarisable in one
sentence, stands on its own, **counter-intuitive**.

Output: `sources/<source-slug>/ideas.md`

For each idea: the core claim, source timestamp, why it stands alone, 2-3 hook
candidates, a visual idea, estimated duration.

Close with a **triage note**: which is cheapest to produce first. Ideas that need a
custom diagram cost more.

> **Known trap:** the idea an LLM puts first is usually the weakest. Do not present
> the ordering as a quality ranking.

**STOP.** Let the user choose.

---

## Stage 3 — Script → GATE 2

Output: `scripts/<short-slug>.md`

```
[SCENE:hook]        0-3s     counter-intuitive claim or question
[SCENE:...]         the problem / the thing people get wrong
[SCENE:...]         explanation + concrete example
[SCENE:takeaway]    one-sentence conclusion
```

Rules:
- **85-115 words** (~35-45s). Assume 2.5 words/sec, then correct with real timings.
- Sentences under 12 words. Strip connectives ("however", "therefore", "moreover").
- **Write 5 hook variants and THROW AWAY THE FIRST.** An LLM's default is always
  explanatory setup ("Today I'll talk about…") — precisely the pattern to avoid.
- Keep technical terms in their common form rather than forcing a translation.
- Don't pin unverified claims on named companies — keep it general.
- Decide where the source credit goes: spoken, on-screen, or description only.
  Description-only costs no TTS credits and no screen time.

Also write into the file: duration table, hook variants with the reasoning for the
pick, delivery notes (where to slow down, what to stress), wording decisions.

**STOP.** Let the user approve or add their own contribution.

> ⚠️ Do not start stages 4 and 5 before the script is final. Narration burns
> ElevenLabs credits and plates take ~9 minutes — a script change wastes both.

---

## Stage 4 — Plates (START IN BACKGROUND)

The script is approved, so the plates' subjects are known. **Start now, don't wait** —
stages 5 and 6 happen while this runs.

```bash
STYLE=real tools/plate.sh <name> "<prompt>" <seed>
```

Write one batch script for all scenes, launch it with `nohup … &`, then move to
stage 5. Watch for completion in the background.

Model lives in `models/flux2-klein-4b/`. Apache 2.0, free, no network needed.

### Measured performance (M4 MacBook Air, 16 GB)

| Resolution | Time | Peak memory | Verdict |
|---|---|---|---|
| **768×1344** (default) | ~1.7 min | 12.2 GB | Daily driver |
| 896×1536 | ~2.2 min | 15.5 GB | Borderline, other apps closed |
| 1088×1920 | ~5.5 min | 20.2 GB | **Don't** — swaps |

### ⭐ THE METHOD: sentence → concrete object → prompt

**This is the most important part of the pipeline.** Plates are not generic "tech
imagery"; each one is the visual form of **that scene's sentence**. Never pull
randomly from a pool.

For each scene, in order:

1. What does this sentence say?
2. What is its **tangible** counterpart? (object, place, moment — not a concept)
3. Can it be framed without legible text in shot?

Full worked example, including a failure and what it taught:
**[docs/visual-method.md](../../../docs/visual-method.md)**

The short version:

- **Recognisability is everything.** Concept visualisations (token streams,
  attention matrices, embedding spaces) were tried and rejected — viewers have no
  referent for them, so they stay decorative. Real objects land.
- **Legible text gives it away.** Diffusion models can't render readable text. Keep
  text out of frame, or get close enough that letters can't be parsed.
- **Never ask a plate to depict an abstraction.** Absence, possibility, uncertainty,
  comparison — those belong to the diagram or the typography. A plate shows a thing
  that exists.
- **Avoid the AI cliché.** Glowing brains, circuit boards, robot hands.
- **Style fixed, subject variable.** The `STYLE=real` suffix is the channel's
  identity; leave it alone.
- **Vary the art direction between videos.** Fifty videos with the same six
  components in the same arrangement is the textbook definition of a template.

### Cost and fallback

5 plates × ~1.7 min ≈ **9 minutes** per video. If one misses, regenerate (+2 min).
If the second attempt misses too, pick from `visuals/plates/library/` — the library
is a **fallback**, never the primary path.

When they're done, copy them to `video/public/plates/`.

---

## Stage 5 — Narration (ElevenLabs API)

Do this while the plates render — it takes seconds.

```bash
python3 tools/tts.py say <short-slug>
```

Audio and word timestamps arrive from a **single call** (`with-timestamps`). No
separate alignment step.

Output: `audio/<slug>.mp3`, `audio/<slug>.words.json`, `video/public/<slug>.mp3`

### Voice identity — DON'T CHANGE IT
Fixed in `.env`. This is the channel's brand; drifting tone between videos is
noticeable. Keep `style` at 0 for explanatory content — the higher it goes, the more
the calm, falling intonation gets flattened.

### Fallback — audio produced by hand

```bash
HF_HOME="$PWD/models/whisper-large-v3-turbo" mlx_whisper audio/<slug>.mp3 \
  --model mlx-community/whisper-large-v3-turbo --language <lang> \
  --word-timestamps True --output-format json --output-dir /tmp/whisper-out

python3 tools/align.py <slug> /tmp/whisper-out/<slug>.json
```

`align.py` takes **timing** from whisper and **words** from the script. Whisper
misspells technical terms; its raw output must never reach the captions. Output
format matches `tts.py`, so nothing downstream changes.

---

## Stage 6 — Scene plan

Everything is ready now: plates generated (paths known), word timings in hand.

**Don't hand-write the skeleton** — generate it:

```bash
python3 tools/make_plan.py scaffold <short-slug>
```

`narration` fields are copied verbatim from the script, which makes the "word count
mismatch" error structurally impossible. You fill in `component`, `props`,
`backdrop.src`, `lang` and `source_credit` (all marked `TODO`).

**Backdrop:** alternate `direction` between `in` and `out` — always the same reads as
a template. `intensity` in the **0.38-0.45** band.

### Available components

| Component | What it does | When |
|---|---|---|
| `WordReveal` | Text landing word by word | hook, takeaway |
| `ChipList` | Label plus items appearing in sequence | enumerations, examples |
| `StampWord` | One word, hard cut in | turning point, pattern interrupt |
| `GatherBlock` | Lines gather into a block, then drift away | accumulation, loss |
| `BoundaryDiagram` | The same box inside vs outside a boundary | ownership, dependency |
| `EndCard` | Closing credit | optional |

If an idea doesn't fit any of them, **write a new component**, add it to `types.ts`
and add a `case` in `Short.tsx`.

### Scene length
A scene past 10 seconds goes static. Consider splitting it sentence by sentence.

---

## Stage 7 — Render and check

```bash
python3 tools/make_plan.py plan <short-slug> audio/<short-slug>.mp3
cd video && npx remotion render Short ../out/<short-slug>.mp4 --log=error
```

- Video length is derived from the audio. Nothing to set by hand.
- Output: 1080×1920, H.264 + AAC.

### Did the render actually run

If Remotion errors out, **the old file stays in place** and you'll think it worked.
Check the timestamp:

```bash
ls -la out/<short-slug>.mp4    # modification time must be NOW
```

### Frame check
```bash
for t in 2 8 18 30; do
  ffmpeg -v error -ss $t -i out/<short-slug>.mp4 -frames:v 1 -q:v 3 /tmp/frame-$t.jpg -y
done
```
**Open the frames and actually look at them.** Checklist:
- Captions not cut mid-sentence
- No text outside the safe area
- Plate recognisable, diagram readable
- No stretch longer than 4 seconds without movement

---

## Stage 8 — Publish

- [ ] Source credit and channel link in the **description**
- [ ] Does the video carry the creator's own insight or example — a monetisation
      requirement, not a stylistic preference
- [ ] Compare against the last 3 videos: different enough, or has it become a template

### AI disclosure — TURN IT ON MANUALLY, EVERY PLATFORM

Required, because the plates are photorealistic. It will **not** happen
automatically: FLUX output carries no C2PA (verified), and the rendered MP4 keeps no
metadata at all. Detail: `docs/platform-policies.md`.

- [ ] **TikTok** — enable the AI-generated content toggle (labelled content stays
      monetisable)
- [ ] **Instagram Reels** — enable "Made with AI"
- [ ] **YouTube Shorts** — enable "Altered or synthetic content" (the label appears
      as an overlay on Shorts)

Not disclosing is the real risk: quiet distribution throttling on Meta, policy
strikes and demonetisation on YouTube.

---

## Naming — TWO SEPARATE SLUGS

Don't conflate them. One source video yields **4-6 shorts** — the relationship is
one-to-many.

```
SOURCE slug = <YYYY-MM-DD>-<simplified-video-title>
              e.g. 2026-07-29-is-anthropic-stealing-your-data
              used by: sources/<source-slug>/

SHORT slug  = <simplified-title>        (NO date)
              e.g. open-weights-not-api
              used by: scripts/ plans/ audio/ video/public/ out/

PLATE name  = <short-slug>-<scene-id>.png
              e.g. open-weights-not-api-difference.png
```

**Simplification:** lowercase · transliterate accented characters to ASCII ·
spaces to `-` · drop punctuation · 50 characters max. Non-ASCII characters must not
appear in filenames — they break shell commands and `staticFile()` paths.

**Plate names must key off the short slug.** Don't use idea numbers like
`f6-hook.png`: every source video has an F6, so the second video overwrites the first.

---

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Plate comes out as pure noise | Model partially downloaded | `plate.sh` checks this now; finish the download |
| `make_plan.py` word count error | `base.json` narration ≠ script | Regenerate with `scaffold` |
| React error #310 | Early `return` before a hook | All hooks unconditional, at the top |
| `ERROR 402` (ElevenLabs) | Free tier blocks library voices | Paid plan required |
| Output file unchanged after render | Render errored out | Check the modification timestamp |
| Memory blowup / very slow plates | Resolution too high | Back to 768×1344 |
| Background job hangs forever | `pgrep -f` matching its own command line | Wait on an output file instead |

---

## Layout

```
sources/<source-slug>/       summary.md · transcript.txt · ideas.md
scripts/<short-slug>.md      script, hook variants, delivery notes
plans/<short-slug>.base.json structure (scaffolded)
      <short-slug>.json      timed plan (generated)
audio/<short-slug>.mp3 · .words.json
visuals/plates/<short-slug>-<scene>.png   script-derived, this short
visuals/plates/library/                   general-purpose FALLBACK plates
video/                       Remotion project · public/plates/
out/<short-slug>.mp4
models/                      flux2-klein-4b/ · whisper-large-v3-turbo/  (kept apart)
tools/                       tts.py · align.py · make_plan.py · plate.sh
docs/                        visual method · platform policies
```
