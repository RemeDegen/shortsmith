#!/usr/bin/env python3
"""
Builds the scene plan that Remotion renders.

Commands:
  scaffold <slug>           generate plans/<slug>.base.json from the script
  text     <slug>           write the plain narration text
  plan     <slug> <mp3>     produce the timed plan Remotion reads

Timing comes from audio/<slug>.words.json when it exists (produced by
tools/tts.py or tools/align.py). Only if that file is missing does this
script fall back to estimating word durations from character length.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_base(slug: str) -> dict:
    return json.loads((ROOT / "plans" / f"{slug}.base.json").read_text(encoding="utf-8"))


def audio_duration_ms(path: Path) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return int(float(out.stdout.strip()) * 1000)


def weight(word: str) -> float:
    """Estimated speaking duration of a word (fallback path only).

    Character count is the base, with extra allowance for pauses after
    punctuation. For agglutinative languages a character-based estimate beats
    a word-based one by a wide margin.
    """
    base = len(re.sub(r"[^\w'’]", "", word, flags=re.UNICODE))
    pause = 3.5 if re.search(r"[.!?:]$", word) else (1.8 if re.search(r"[,;]$", word) else 0.0)
    return max(base, 1) + pause


def cmd_scaffold(slug: str) -> None:
    """Generate the base.json skeleton from the script.

    `narration` fields are copied VERBATIM from the script rather than typed by
    hand, which makes the "word count mismatch" error structurally impossible.

    You fill in: component, props, backdrop.src, source_credit.
    """
    script = ROOT / "scripts" / f"{slug}.md"
    if not script.exists():
        sys.exit(f"ERROR: scripts/{slug}.md not found.")

    block = re.search(r"```\n(\[SCENE.*?)```", script.read_text(encoding="utf-8"), re.S)
    if not block:
        sys.exit(f"ERROR: no fenced script block found in scripts/{slug}.md")

    scenes = []
    for m in re.finditer(r"\[SCENE:(\w+)\]\n(.*?)(?=\n\[SCENE|\Z)", block.group(1), re.S):
        sid = m.group(1)
        scenes.append({
            "id": sid,
            "role": {"hook": "hook", "takeaway": "takeaway"}.get(sid, "TODO"),
            "component": "WordReveal",          # TODO: pick the right component
            "narration": " ".join(m.group(2).split()),
            "backdrop": {
                "src": f"plates/{slug}-{sid}.png",   # TODO: confirm once generated
                # Alternate the Ken Burns direction; always the same reads as a template.
                "direction": "in" if len(scenes) % 2 == 0 else "out",
                "intensity": 0.42,
            },
            "props": {},
        })

    out = ROOT / "plans" / f"{slug}.base.json"
    if out.exists():
        sys.exit(f"ERROR: plans/{slug}.base.json already exists. Not overwriting.")

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(
        {"slug": slug, "lang": "TODO", "source_credit": "TODO", "fps": 30, "scenes": scenes},
        ensure_ascii=False, indent=2), encoding="utf-8")

    total = sum(len(s["narration"].split()) for s in scenes)
    print(f"scaffold → plans/{slug}.base.json")
    print(f"           {len(scenes)} scenes · {total} words (verbatim from script)")
    print("\nStill to fill in:")
    for s in scenes:
        print(f"  {s['id']:<12} component={s['component']}  props={{}}  "
              f"backdrop={s['backdrop']['src']}")
    print("\n  plus `lang` and `source_credit`.")


def cmd_text(slug: str) -> None:
    base = load_base(slug)
    text = " ".join(s["narration"] for s in base["scenes"])
    out = ROOT / "audio" / f"{slug}.txt"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(text + "\n", encoding="utf-8")
    print(f"text → {out.relative_to(ROOT)}  ({len(text.split())} words)")


def write_plan(slug: str, plan: dict) -> None:
    (ROOT / "plans" / f"{slug}.json").write_text(
        json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    # The copy Remotion imports
    (ROOT / "video" / "src" / "plan.json").write_text(
        json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"plan  → plans/{slug}.json   [{plan['timing_source']}]")
    print(f"length→ {plan['duration_ms']/1000:.2f}s · {len(plan['words'])} words "
          f"· {len(plan['scenes'])} scenes")
    for s in plan["scenes"]:
        print(f"  {s['id']:<12} {s['start_ms']/1000:>6.2f} → {s['end_ms']/1000:>6.2f}s"
              f"  ({(s['end_ms']-s['start_ms'])/1000:.2f}s)  {s['component']}")


def cmd_plan_from_words(slug: str, audio_path: str) -> None:
    """Build the plan from real word timestamps. No estimation."""
    base = load_base(slug)
    words = json.loads((ROOT / "audio" / f"{slug}.words.json").read_text(encoding="utf-8"))
    total_ms = audio_duration_ms(Path(audio_path))

    counts = [len(s["narration"].split()) for s in base["scenes"]]
    if sum(counts) != len(words):
        sys.exit(
            f"ERROR: scene narration word count ({sum(counts)}) does not match "
            f"words.json ({len(words)}).\n"
            f"The narration fields in plans/{slug}.base.json must match the script "
            f"verbatim — regenerate with `make_plan.py scaffold`."
        )

    scenes, i = [], 0
    for scene, n in zip(base["scenes"], counts):
        chunk = words[i:i + n]
        scenes.append({
            "id": scene["id"], "role": scene["role"], "component": scene["component"],
            "start_ms": chunk[0]["start_ms"], "end_ms": chunk[-1]["end_ms"],
            "narration": scene["narration"],
            "backdrop": scene.get("backdrop"),
            "captions": scene.get("captions", True),
            "props": scene["props"],
        })
        i += n

    # No gaps between scenes: each ends where the next begins.
    for a, b in zip(scenes, scenes[1:]):
        a["end_ms"] = b["start_ms"]
    scenes[-1]["end_ms"] = total_ms

    write_plan(slug, {
        "slug": base["slug"], "lang": base["lang"],
        "source_credit": base["source_credit"], "fps": base["fps"],
        "audio": Path(audio_path).name, "duration_ms": total_ms,
        "timing_source": "measured (words.json)",
        "words": words, "scenes": scenes,
    })


def cmd_plan(slug: str, audio_path: str) -> None:
    # Never fall back to estimation when real timings exist.
    if (ROOT / "audio" / f"{slug}.words.json").exists():
        return cmd_plan_from_words(slug, audio_path)

    base = load_base(slug)
    audio = Path(audio_path)
    total_ms = audio_duration_ms(audio)

    scenes_words = [s["narration"].split() for s in base["scenes"]]
    all_weights = [[weight(w) for w in ws] for ws in scenes_words]
    grand_total = sum(sum(ws) for ws in all_weights)

    scenes, words, cursor = [], [], 0.0
    for scene, ws, weights in zip(base["scenes"], scenes_words, all_weights):
        scene_start = cursor
        for word, wt in zip(ws, weights):
            dur = total_ms * (wt / grand_total)
            words.append({"text": word, "start_ms": round(cursor),
                          "end_ms": round(cursor + dur)})
            cursor += dur
        scenes.append({
            "id": scene["id"], "role": scene["role"], "component": scene["component"],
            "start_ms": round(scene_start), "end_ms": round(cursor),
            "narration": scene["narration"],
            "backdrop": scene.get("backdrop"),
            "captions": scene.get("captions", True),
            "props": scene["props"],
        })

    scenes[-1]["end_ms"] = total_ms
    words[-1]["end_ms"] = total_ms

    write_plan(slug, {
        "slug": base["slug"], "lang": base["lang"],
        "source_credit": base["source_credit"], "fps": base["fps"],
        "audio": audio.name, "duration_ms": total_ms,
        "timing_source": "ESTIMATED — no words.json found",
        "words": words, "scenes": scenes,
    })


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    mode, slug = sys.argv[1], sys.argv[2]
    if mode == "scaffold":
        cmd_scaffold(slug)
    elif mode == "text":
        cmd_text(slug)
    elif mode == "plan" and len(sys.argv) > 3:
        cmd_plan(slug, sys.argv[3])
    else:
        print(__doc__); sys.exit(1)
