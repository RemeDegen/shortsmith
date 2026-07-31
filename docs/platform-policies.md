# Platform policies — AI disclosure and monetisation

Researched July 2026. Policies change; verify before you rely on this.

---

## Summary

1. **Disclosure is required on all three platforms** if your visuals are
   photorealistic AI output. Ours are, so we disclose.
2. **Disclosure does not hurt you.** TikTok states labelled AI content stays
   monetisable. Instagram states the AI-creator label does not affect
   recommendations. YouTube states declaring AI content neither restricts audience
   nor affects monetisation eligibility.
3. **Automatic detection will not catch this pipeline.** All three read C2PA
   metadata. Locally generated FLUX output has none — verified. So the toggle is on
   you.
4. **Not disclosing is the actual risk**, not the label.
5. **The bigger threat isn't disclosure at all** — it's the inauthentic-content
   policy. See the last section.

---

## TikTok

**Triggers a label:** realistic-looking people or scenes a viewer could reasonably
believe are real — AI-generated or face-swapped humans, cloned voices,
**photorealistic synthetic scenes**.

**Doesn't:** stylised or fantasy effects. AI-assisted *text* — scripts, captions,
hashtags — needs no disclosure.

**How:** the creator toggles it at upload. TikTok also reads C2PA Content Credentials
and labels automatically, and may restrict or remove depending on risk.

**Monetisation:** labelled AI content remains eligible.

**Banned outright:** undisclosed deepfakes of real people; synthetic media of private
individuals.

---

## Meta — Instagram / Facebook (organic)

Two separate systems, often confused.

### "Made with AI" / "AI Info" — content label
A toggle when publishing a reel, story or post. Meta also applies it automatically
when industry signals (C2PA) flag photorealistic AI video, audio or images.

Triggers when AI generated the **subject** of the image — a person, product, scene.
Colour correction, cropping and similar adjustments don't count.

**Effect:** Meta's own research reports *"slightly lower engagement and higher
comment scrutiny"* on AI-Info-labelled posts. Measurable, small.

### "AI creator" — account label (May 2026, optional)
For accounts that frequently post AI content. Appears in the bio and beside content
in Feed, Reels and Explore: *"This profile posts content that was generated or
modified with AI."*

- Entirely optional.
- **No algorithmic penalty** — Instagram states it does not affect recommendation
  distribution.
- If a post already carries "AI info", that shows instead.

A judgement call rather than a compliance one: if your channel is *about* AI rather
than *made of* AI, the label may imply the wrong thing.

### Ads
Since July 2026 disclosure is mandatory in Facebook/Instagram **ads**, and
undisclosed AI is among the fastest-growing rejection reasons. Doesn't apply to
organic posting, will apply if you ever run ads.

---

## YouTube

**Triggers:** realistic altered or synthetic content — synthetic voices, digitally
manipulated visuals depicting things that didn't happen, fabricated events. AI-assisted
enhancements like colour correction don't.

**How:** a disclosure toggle at upload, plus limited automatic detection. Since May
2026 YouTube auto-labels undisclosed content its systems flag as seriously
photorealistic AI. Content carrying C2PA or made with YouTube's own AI tools cannot
have the label removed.

**Effect:** YouTube's wording is explicit — *"disclosing AI content does not restrict
a video's audience or affect monetisation eligibility."* Observed CTR reduction on
labelled videos is described as modest.

**On Shorts the label appears as an overlay on the video itself**, not below the
player. An aesthetic cost worth knowing about.

**Not disclosing:** policy strikes and possible demonetisation.

---

## Comparison

| | TikTok | Instagram/Facebook | YouTube |
|---|---|---|---|
| Trigger | Realistic person/scene, cloned voice | AI generated the image's subject | Realistic altered/synthetic content |
| Manual toggle | At upload | When publishing | At upload |
| Auto-detection | C2PA | C2PA + industry signals | Limited |
| Label position | On the content | Beside the post | Overlay on Shorts |
| Distribution effect | Not stated | "Slightly lower engagement" | "Modest" CTR drop |
| Monetisation | Unaffected | — | Unaffected |
| If you don't disclose | Auto-label / restriction / removal | Quiet distribution throttling | Policy strike, demonetisation |

---

## C2PA — verified, not assumed

The assumption that locally generated plates might carry C2PA and get auto-labelled
turned out to be **wrong**. Checked directly.

A generated plate contains:

```xml
<dc:creator>MFLUX</dc:creator>
<dc:rights>AI Generated Content</dc:rights>
<xmp:CreatorTool>MFLUX 0.18.0</xmp:CreatorTool>
<mflux:model>Runpod/FLUX.2-klein-4B-mflux-4bit</mflux:model>
<mflux:seed>43</mflux:seed>
```

That's **XMP**, not C2PA. The difference matters:

- **XMP** — a plain-text descriptive tag. It says "AI Generated Content" but carries
  no cryptographic signature, so platforms don't treat it as a trusted signal.
- **C2PA** — a signed JUMBF box with a verifiable provenance chain. This is what
  auto-labelling looks for. **Zero matches** in our files.

And the rendered MP4 keeps **no metadata at all** — Remotion re-encodes, so even the
XMP is gone.

**This is not a loophole, it's a responsibility.** Nothing will label the video for
you, so if you don't flip the toggle you have published undisclosed AI content.

---

## What we disclose

| Element | Disclosure needed | Why |
|---|---|---|
| **FLUX plates** (server rooms, desks, hardware) | **Yes** | Photorealistic, depicts a scene that never happened |
| **Synthetic narration** | Probably not | Rules target cloned voices of *real people*; a library voice isn't anyone's clone |
| Code-drawn diagrams | No | Hand-written code, not generated |
| Kinetic typography, captions | No | AI-assisted text is out of scope |
| The script | No | Written content isn't covered |

Since the plates alone require it, the toggle goes on regardless.

---

## The bigger risk: inauthentic content

Disclosure is the easy part. YouTube's July 2026 inauthentic-content policy is the
one that actually threatens a channel, and it names patterns this kind of pipeline
naturally produces:

- *"Content that appears to be made from a template"*
- *"Image slideshows and templated storylines"*
- *"Scrolling text, animations"*
- *"Mass-produced AI content made with generic templates without adding the
  creator's own original insight or perspective"*
- *"Content without a clear narrative arc — for example videos stitching together
  unrelated or incoherent AI clips"*

What's allowed is stated just as clearly: *"using automated tools or templates is
fine, as long as the final product carries the creator's creative vision and offers
educational or entertainment value."* The distinguishing factor is whether AI is a
**tool** or a **replacement for creativity**.

It is assessed at the **channel** level — theme, top videos, metadata, overall
production pattern — not per video. Enforcement escalates: ad revenue restriction →
monetisation suspension → channel termination.

### Three protections this pipeline builds in

1. **Two human gates.** Idea selection and script approval. Fully unattended
   generation is the pattern being punished.
2. **Variation between videos.** Fifty videos with the same six components in the
   same arrangement is the textbook definition of a template. Change one major
   element per video.
3. **Plates tied to the narrative.** "Stitching together unrelated AI clips" targets
   exactly the random-pool approach. Every plate is derived from a specific sentence
   — see [visual-method.md](visual-method.md).
