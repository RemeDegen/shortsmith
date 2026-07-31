# shortsmith

Turns the *ideas* in a long-form video into original short-form videos.
Source footage and audio are never reused — only ideas travel.

## Producing a short

When the user gives a video link and asks for a short, **run the `make-short` skill**
(`.claude/skills/make-short/SKILL.md`). Stages, commands, measured parameters and the
visual rules found by experiment all live there. Follow it rather than improvising.

## Setup

Missing tools or a fresh machine: **`SETUP.md`**. Every command in it was actually
run, including download sizes and the errors people hit.

## Where things stand

**Check `STATUS.md`** — which short is at which stage, which parts of the pipeline
work, what's outstanding. Single source of truth; don't duplicate it elsewhere.

## Fixed decisions

- Source footage/audio is never used. Ideas only, with credit.
- No stock video. Visuals are locally generated plates plus code-driven motion.
- Motion is written in code, not generated. Rationale: `docs/platform-policies.md`.
- Plates are derived from specific script sentences, never pulled from a pool.
  Method and worked example: `docs/visual-method.md`.
- Two human gates (idea selection, script approval) are deliberate, not friction.
