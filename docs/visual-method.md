# The visual method

How background plates are chosen. This is the part that decides whether a video
looks made or looks generated.

---

## The rule

> **sentence → concrete object → prompt**

A plate is never generic "tech imagery". It is the visual form of the specific
sentence being spoken over it. For each scene, in order:

1. What does this sentence say?
2. What is its **tangible** counterpart? (object, place, moment — not a concept)
3. Can it be framed without legible text in shot?

---

## Worked example

A ~35 second short arguing that people who say they "switched to open-weight models"
have usually just bought a cheap API subscription — which is not the same thing.

| Scene | Sentence | Concrete counterpart | Result |
|---|---|---|---|
| `difference` | *"The model is sitting on your disk."* | A bare NVMe SSD on a wooden desk under warm lamp light, blurred code screen behind | ✅ **The best one.** An abstract argument about ownership collapsed into a single object you could pick up |
| `dependency` | *"The door closes."* | A locked server cabinet, perforated steel mesh, amber lights behind it, shot from outside | ✅ "You're shut out" reads instantly |
| `takeaway` | *"Your own infrastructure is a decision."* | A small server on a shelf in a home office at night, one steady amber light, a plant beside it | ✅ Settled, permanent, yours |
| `mistake` | *"…from a provider on the other side of the world."* | Thick cable bundles, one distant light | ✅ "Someone else's infrastructure, far away" |
| `hook` | *"You probably didn't."* | An **empty slot** in a server rack | ❌ **Failed** — see below |

The prompt behind the best one:

```
a bare NVMe solid state drive resting on a wooden desk under warm lamp light,
extreme close up, shallow focus, physical object you can hold
```

Plus the fixed style suffix (`STYLE=real` in `tools/plate.sh`), which is what keeps
every plate in the same visual world.

---

## Why the hook failed

It asked the model to depict **absence** — something that isn't there. Diffusion
models can only draw things that *are*. The output was a generic dark server room;
the "empty slot" idea never survived.

**Rule that came out of it:** absence, possibility, uncertainty and comparison
belong to the diagram or the typography. A plate shows a thing that exists.

---

## What was tried and rejected

An earlier round generated six "AI ecosystem" plates: token streams, attention
matrices, agent graphs, embedding spaces, log streams, layered code windows.

**Only the layered code windows survived.** The dividing line was not how abstract
they were:

- **Rejected** — visualisations of *concepts*. Token flow, attention, embedding
  space. The viewer has no referent, so they land as decorative patterns.
- **Kept** — a stylised version of a *real object*: overlapping translucent panels,
  i.e. several code windows open on a screen. Recognisable.

So the criterion is **recognisability**, not realism or abstraction.

---

## Framing: legible text gives it away

Diffusion models cannot render readable text. Plates where a monitor filled the
frame looked obviously fake — you could see the letters were nonsense. Plates with
no text at all (server racks, cabinets, hardware) or with text at macro scale and out
of focus read as completely plausible.

**Either keep text out of frame, or get close enough that letters can't be parsed.**
A wide shot of a monitor is the worst case.

---

## Avoid the AI cliché

Glowing brains, circuit boards, robot hands. A technical audience reads them as cheap
instantly, and they are the visual signature of exactly the mass-produced content
platforms are filtering for.

---

## Motion is code, not generated video

Plates are **still images**. All movement is computed per frame in
`video/src/components/Backdrop.tsx`: Ken Burns, two-layer parallax, animated grain,
vignette.

This is a deliberate architectural choice, for four reasons:

1. **Platform risk.** "Unrelated AI clips edited together" is named explicitly in
   demonetisation policy. Code-driven motion over a texture plate is not that.
2. **Cost.** Local image generation is free. Cloud video generation runs
   $300-3000/year at a modest publishing cadence.
3. **Consistency.** Video models drift in style between calls; by video 20 the
   archive looks incoherent. A fixed prompt plus your own motion doesn't drift.
4. **Longevity.** Video generation APIs get deprecated. A local Apache-2.0 model
   doesn't disappear.

### Measured settings

| Setting | Value | Note |
|---|---|---|
| `intensity` | 0.38-0.45 | A first guess of 0.15-0.25 was invisible — plates are dark |
| back layer blur | 8px | At 18px a server rack became an orange smear |
| front layer blur | 2px | Sharper layer is what creates the parallax |
| Ken Burns scale | 1.02 → 1.10 | Must stay above 1 or edges expose the background |

If a diagram competes with a busy plate, **don't re-blur the plate** — darken only
the diagram's own area. `BoundaryDiagram` does this with a radial scrim.

---

## Generation cost

| Resolution | Time | Peak memory (16 GB machine) |
|---|---|---|
| **768×1344** | ~1.7 min | 12.2 GB |
| 896×1536 | ~2.2 min | 15.5 GB |
| 1088×1920 | ~5.5 min | 20.2 GB — swaps, unusable |

About **9 minutes per video** for five plates. Start it in the background and do the
narration and scene plan while it runs.

---

## The library is a fallback

`visuals/plates/library/` collects general-purpose plates that accumulate over time.
Use it when a script-derived plate misses twice — as in the failed hook above, which
fell back to a library macro-screen shot.

It is a safety net, not the primary path. Pulling randomly from a pool is exactly
what loses the quality the method exists to produce.
