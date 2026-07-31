# Example script

What `scripts/<short-slug>.md` should look like. Copy the shape, not the content.

The fenced block is the only part the tools read — `tts.py` extracts the narration
from it and `make_plan.py scaffold` builds the scene skeleton from it. Everything
else in the file is for humans.

---

## Script

```
[SCENE:hook]
"I switched to an open-weight model," you say.
You probably didn't.

[SCENE:mistake]
Here's what most people actually did:
bought a cheap API subscription from a provider overseas.
The model is open-weight, sure. But you never touched the weights.

[SCENE:difference]
Owning a model means one thing:
you downloaded the weights and put them on hardware you control.
The model sits on your disk. If the provider shuts down tomorrow, yours keeps running.

[SCENE:dependency]
As long as you call an API, you're still a guest.
Prices change, limits arrive, the door closes.
And enforcing terms of service against a company overseas is much harder.

[SCENE:takeaway]
Open weights are a licence. Your own infrastructure is a decision.
Don't confuse the two.
```

> Source credit goes in the video description, not the narration — it costs no TTS
> credits and no screen time.

---

## Duration

| Scene | Words | Estimate |
|---|---|---|
| hook | 12 | ~4.8s |
| mistake | 30 | ~12.0s |
| difference | 33 | ~13.2s |
| dependency | 28 | ~11.2s |
| takeaway | 14 | ~5.6s |
| **total** | **117** | **~47s** |

Assumes 2.5 words/sec. Real timings come from `audio/<slug>.words.json` after
narration — this table is only a pre-check.

`mistake`, `difference` and `dependency` all run past 10 seconds. Scenes that long go
static; consider splitting them so each sentence gets its own beat.

---

## Hook variants

Rule: write 5, **throw away the first**. An LLM's default is always explanatory setup.

| # | Variant | Type | Verdict |
|---|---|---|---|
| 1 | "Today I want to talk about a common misconception around open-weight models." | explanatory setup | **Discarded** — the exact pattern to avoid |
| 2 | "'I switched to an open-weight model,' you say. You probably didn't." | direct contradiction | **Selected** |
| 3 | "You're not using an open-weight model. You're using an API." | bold claim | Backup — strong but puts the viewer on the defensive |
| 4 | "Renting a model and owning one aren't the same thing." | drawing a distinction | Weak — abstract, no curiosity |
| 5 | "If you didn't download it, it isn't yours." | aphorism | Strong backup — very short, may need context |

**Why 2:** it takes the viewer's own sentence and contradicts it immediately. The
objection — "but I did switch" — forms in the first second, and that open loop is
what keeps them watching. Unlike 3 it isn't accusatory; "probably" leaves the door ajar.

---

## Delivery notes

- **"You probably didn't."** — brief pause before it, then flat and certain. This
  sets the tone for the whole video.
- **"The model sits on your disk."** — slow down here; this is the proof sentence.
- **"Prices change, limits arrive, the door closes."** — three short beats
  accelerating, no breath between them. The pressure comes from the rhythm.
- **"Open weights are a licence. Your own infrastructure is a decision."** — a clear
  pause between the halves so the symmetry is audible.

---

## Wording decisions

- Technical terms left in their common form rather than forced into translation.
- **No provider named.** The source implies specific companies; we say "a provider
  overseas". Attaching an unverified claim to a named company is needless risk, and
  the idea stands without it.
- Sentences kept under 12 words; connectives stripped. A script that reads well on
  paper can still be dead when spoken.
